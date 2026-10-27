import os
from unittest.mock import patch
import httpx
from django.test import SimpleTestCase
from .gemini import generate
from .pip_ai import TOOLS,ai_call

class GeminiTests(SimpleTestCase):
    def payload(self):return {'model':'gemini-3.5-flash-lite','instructions':'Be Pip','input':[{'role':'user','content':'hi'}],'tools':TOOLS,'tool_choice':'auto'}
    @patch('core.gemini.httpx.post')
    def test_greeting_and_server_only_key(self,post):
        post.return_value=httpx.Response(200,json={'candidates':[{'content':{'parts':[{'text':'Hi!'}]}}]})
        result=generate(self.payload(),'test-private-key',20)
        self.assertEqual(result['output'][0]['content'][0]['text'],'Hi!')
        kwargs=post.call_args.kwargs
        self.assertEqual(kwargs['headers']['x-goog-api-key'],'test-private-key')
        self.assertNotIn('test-private-key',str(kwargs['json']))
        self.assertEqual(kwargs['json']['contents'][0]['role'],'user')
    @patch('core.gemini.httpx.post')
    def test_function_roundtrip_preserves_signature(self,post):
        part={'functionCall':{'name':'search_movies','args':{'query':'Inception'}},'thoughtSignature':'opaque-signature'}
        post.return_value=httpx.Response(200,json={'candidates':[{'content':{'parts':[part]}}]})
        payload=self.payload();call=generate(payload,'key',20)['output'][0]
        payload['input'] += [call,{'type':'function_call_output','call_id':call['call_id'],'output':'{"results":[]}'}]
        generate(payload,'key',20)
        contents=post.call_args.kwargs['json']['contents']
        self.assertEqual(contents[1]['parts'][0],part)
        self.assertEqual(contents[2]['parts'][0]['functionResponse']['name'],'search_movies')
    @patch.dict(os.environ,{'PIP_AI_PROVIDER':'gemini'})
    @patch('core.pip_ai.generate',return_value={'output':[]})
    @patch('core.pip_ai.httpx.post')
    def test_gemini_never_falls_back_to_openai(self,post,gemini):
        ai_call(self.payload(),'key',20);gemini.assert_called_once();post.assert_not_called()
