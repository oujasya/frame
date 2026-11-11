from unittest.mock import patch
from django.test import SimpleTestCase
from rest_framework.test import APIClient
from .common import Problem

class PersonEndpointTests(SimpleTestCase):
    def test_profile_and_credits_exclude_adult_films(self):
        payload={'id':98,'name':'Film person','movie_credits':{'cast':[{'id':1},{'id':2,'adult':True}],'crew':[{'id':3,'job':'Director'}]}}
        with patch('core.movies.tmdb',return_value=payload) as fetch:
            response=APIClient().get('/api/people/98')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['movie_credits']['cast'],[{'id':1}])
        self.assertEqual(response.json()['movie_credits']['crew'][0]['job'],'Director')
        fetch.assert_called_once_with('/person/98',append_to_response='movie_credits')

    def test_missing_person_and_upstream_failure(self):
        for status in (404,502):
            with self.subTest(status=status),patch('core.movies.tmdb',side_effect=Problem(status,'Unavailable')):
                response=APIClient().get('/api/people/98')
                self.assertEqual(response.status_code,status)
                if status==404:self.assertEqual(response.json()['detail'],'Person not found.')

    def test_invalid_id_does_not_reach_provider(self):
        with patch('core.movies.tmdb') as fetch:
            self.assertEqual(APIClient().get('/api/people/0').status_code,422)
            fetch.assert_not_called()

    def test_read_only(self):
        self.assertEqual(APIClient().post('/api/people/98',{},format='json').status_code,405)
