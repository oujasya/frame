"""Translate bounded Pip conversations and movie tools to Gemini's REST API."""
import json
import httpx
from .common import Problem

def generate(payload,key,remaining):
    contents=[];names={}
    def add(role,part):
        if contents and contents[-1]['role']==role:contents[-1]['parts'].append(part)
        else:contents.append({'role':role,'parts':[part]})
    for item in payload['input']:
        if item.get('type')=='function_call':
            names[item['call_id']]=item['name']
            add('model',item.get('_gemini_part') or {'functionCall':{'name':item['name'],'args':json.loads(item['arguments'])}})
        elif item.get('type')=='function_call_output':
            add('user',{'functionResponse':{'name':names[item['call_id']],'response':json.loads(item['output'])}})
        elif item.get('type')=='message':
            for part in item.get('content',[]):
                if part.get('text'):add('model',{'text':part['text']})
        else:add('model' if item['role']=='assistant' else 'user',{'text':item['content']})
    declarations=[{'name':t['name'],'description':t['description'],'parameters':{k:v for k,v in t['parameters'].items() if k!='additionalProperties'}} for t in payload['tools']]
    body={'contents':contents,'systemInstruction':{'parts':[{'text':payload['instructions']}]},'generationConfig':{'maxOutputTokens':2048},'tools':[{'functionDeclarations':declarations}],'toolConfig':{'functionCallingConfig':{'mode':'NONE' if payload['tool_choice']=='none' else 'AUTO'}}}
    try:response=httpx.post('https://generativelanguage.googleapis.com/v1beta/models/'+payload['model']+':generateContent',headers={'x-goog-api-key':key},json=body,timeout=httpx.Timeout(min(remaining,28),connect=5))
    except httpx.HTTPError:raise Problem(502,'Pip could not reach Gemini. Please try again.')
    if response.status_code==429:raise Problem(429,'Pip has reached Gemini’s free usage limit. Please try again later.')
    if response.status_code in (400,401,403):raise Problem(503,'Pip’s Gemini access needs attention from the site owner.')
    if response.status_code>=400:raise Problem(502,'Gemini could not answer that request. Please try again.')
    try:parts=response.json().get('candidates',[{}])[0].get('content',{}).get('parts',[])
    except (ValueError,IndexError,TypeError):raise Problem(502,'Pip received an unreadable reply. Please try again.')
    output=[]
    for index,part in enumerate(parts):
        if 'functionCall' in part:
            call=part['functionCall'];output.append({'type':'function_call','name':call['name'],'arguments':json.dumps(call.get('args',{})),'call_id':f'gemini_{len(contents)}_{index}','_gemini_part':part})
        elif part.get('text') and not part.get('thought'):output.append({'type':'message','role':'assistant','content':[{'type':'output_text','text':part['text']}]})
    return {'output':output}
