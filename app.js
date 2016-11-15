var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    engines = require('consolidate'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    fs = require('fs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

var coverImgNotFound = fs.readFileSync(__dirname +'/public/img/No_Cover.jpg');

MongoClient.connect('mongodb://localhost:27017/elib', function(err, db) {

    console.log("Successfully connected to MongoDB.");
    var vlibs = [];

    db.collection('library').distinct('vlibs',function(err, docs) {
       for (var i = 0, len = docs.length; i <len; i++){
           var vlib = {};
           vlib['name'] = docs[i];
           vlib['active'] = 0;
           vlibs.push(vlib);
       }
    });

    app.post('/search', function(req, res){
        if (!req.body) return res.sendStatus(400)
        
        var query = {};
        if (req.body.inputSearchTitle) query['title'] = new RegExp(req.body.inputSearchTitle,'i');
        if (req.body.inputSearchAuthor) query['authors'] = new RegExp(req.body.inputSearchAuthor,'i');
        if (req.body.inputSearchSynopsis) query['synopsis'] = new RegExp(req.body.inputSearchSynopsis,'i');

        if (!req.body.inputSearchTitle && !req.body.inputSearchAuthor && !req.body.inputSearchSynopsis) query['authors'] = new RegExp('Chattam','i');

        db.collection('library').find(query).toArray(function(err, docs) {
            res.render('templates/documents', { 'documents': docs, 'vlibs': vlibs } );
        });
    });
    
    app.get('/', function(req,res){
        res.render('templates/index');
    });

    app.get('/cover/:id', function(req,res){
 	db.collection('covers').find({_id: new ObjectID(req.params.id)}).limit(1).next(function(err, doc){
          if (err || !doc) {
             res.contentType('image/jpeg');
             res.send(coverImgNotFound);
             return;
          }
          res.contentType(doc.contentType);
          res.send(doc.data.buffer);
    	})
    });

    app.get('/list', function(req, res){
        db.collection('library').find({}).limit(10).toArray(function(err, docs) {
            res.render('templates/documents', { 'documents': docs, 'vlibs': vlibs } );
        });
    });

    app.use(function(req, res){
        res.sendStatus(404);
    });
    
    var server = app.listen(8000, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    });
});
