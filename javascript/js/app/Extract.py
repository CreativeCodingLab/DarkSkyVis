

 # 'author': 'johanna',
 # 'created_at': {'$date': '2015-10-22T14:48:35.2Z'},
 # 'habitat_tag': {'index': 0, 'name': 'Habitat 1'},
 # 'media': ['ew5cgko4cg.jpg'],
 # 'body': '\n\nNotes on pictures and videos: \nPic 1: some creatures are sitting quietly. Others not so much. ',
 # 'note_type_tag': 'Relationships',
 # 'title': 'Test note'}



from PIL import Image
import json
import requests
from StringIO import StringIO


with open('/Users/krbalmryde/Downloads/6BAM.json') as f:
    data = json.load(f)

for i, d in enumerate(data):

    title = '_'.join(
        [   "_".join(d['habitat_tag']['name']),
            d['author'],
            d['title'],
            d['note_type_tag']
        ])

    with open(title, 'w') as w:
        w.write( "Title: " + d['title'] )
        w.write( "Author: " + d['author'] )
        w.write( "Relationship: " + d['note_type_tag'] )
        w.write( "Content: " + d['body'] )
        w.write( "Content: " + d['body'] )
        if len(d['media']) > 0:
            w.write( "Media: " + d['media'][0] )

# response = requests.get(url)
# img = Image.open(StringIO(response.content))
