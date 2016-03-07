# iris-solr

## How to install
```

1. Install solair.
2. create a core in solair
3. Copy the content of this repo to home/modules/irisSolr folder
4. enable the Solr Search Module
```

## More temporary steps

```
1. in handlebars_helpers.js, add this code for compare helpers to work

Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
    if (arguments.length < 4) {
      throw new Error("Handlerbars Helper 'compare' needs 3 parameters");
    }

    var result = eval("'" + lvalue + "' " + operator + " '" + rvalue + "'");
    if (result) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
  
  
2. npm install query-string
3. npm install solr-client

```
## How to use

```
1. navigate to /admin/config/search/solr/
2. provide your solr server configuration
3. Add or Update an entity
4. navigate to /search
5. search for an entity that you have added e.g. filter = username:foo or filter = foo
6. enjoy and help improve the search POC page
```
