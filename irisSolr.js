
iris.modules.auth.globals.registerPermission("can fetch page", "Search", "Can user search records");

var search = {
  connection_config: {
    "title": "Search Configuration",
    "description": "Solr server connection settings",
    "permission": ["can fetch page"]
  },
  query: {
    "title": "Search query",
    "description": "search query in solr",
    "permission": ["can fetch page"]
  },
  index_config: {
    "title": "Search Field Configuration",
    "description": "Define each field index and search boost",
    "permission": ["can fetch page"]
  }

};

iris.route.get('/search', search.query, function(req, res) {
  iris.modules.irisSolr.globals.generateSearch(req, res);
});

/**
 * Endpoint to manage Solr connection details.
 */

iris.route.get('/admin/config/search/solr', search.connection_config, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["solrconnection"], ['admin_wrapper'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function(success) {

    res.send(success);

  }, function(fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });
});

/**
 * TODO : it display just a copy paste content list of entities 
 */
iris.route.get("/admin/config/search/solr/entities", search.index_config, function(req, res) {


  iris.modules.frontend.globals.parseTemplateFile(["solrentities"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function(fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});


iris.modules.irisSolr.globals.generateEntityForm = function(thisHook, data, config) {

  var entityTypes = Object.keys(iris.dbCollections);
  var fields = [];

  var getFields = function (entity) {

    Object.keys(entity).forEach(function (field) {

      if (entity[field].fieldType != 'Fieldset') {
        fields[field] = entity[field].fieldType;
      }
      else {
        getFields(entity[field].subfields);
      }
    });

  }

  entityTypes.forEach(function (type) {

    fields = {};
    var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[type]));

    // Add defaults.
    schema.fields['entityType'] = {'fieldType' : 'Textfield'}
    schema.fields['entityAuthor'] = {'fieldType' : 'Number'}
    schema.fields['eid'] = {'fieldType' : 'Number'}

    getFields(schema.fields);

    var fieldsObject = {};
    Object.keys(fields).forEach(function (field) {

      fieldsObject[field] = {
        "type": "object",
        "title": field,
        "properties": {
          "indexField": {
            "type": "string",
            "title": "Index field",
            "enum": ['index', 'ignore']
          }
        }
      }

    });

    data.schema[type] = {
      type: "object",
      title: type,
      "properties": {
        "indexEntity": {
          "type": "boolean",
          "title": "Index this entity"
        },
        "fields": {
          "type": "object",
          "title": "Fields",
          "properties": fieldsObject
        }
      }
    }

  });

  // Apply defaults
  if (config) {

    Object.keys(config).forEach(function(entity) {

      data.value[entity] = {"indexEntity": config[entity].indexEntity};

      Object.keys(config[entity].fields).forEach(function(field) {

        if (!data.value[entity].fields) {
          data.value[entity].fields = {};
        }
        data.value[entity].fields[field] = config[entity].fields[field]

      });

    });


  }

  thisHook.pass(data);

}

/**
 * Defines form solrEntities.
 * All entity and field specific settings.
 */

iris.modules.irisSolr.registerHook("hook_form_render__solrEntities", 0, function (thisHook, data) {


  iris.readConfig('irisSolr', 'solrEntities').then(function (config) {

    iris.modules.irisSolr.globals.generateEntityForm(thisHook, data, config);

  }, function(fail) {

    iris.modules.irisSolr.globals.generateEntityForm(thisHook, data, false);

  });

});

/**
 * Submit handler for form solrEntities.
 * All entity and field specific settings.
 */
iris.modules.irisSolr.registerHook("hook_form_submit__solrEntities", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.context.params, 'irisSolr', 'solrEntities');

  data.messages.push({
    "type" : "info",
    "message" : "Successfully saved"
  });

  thisHook.pass(data);

});


/**
 * Defines configuration form adminSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_render__adminSolr", 0, function(thisHook, data) {

  iris.readConfig('irisSolr', 'adminSolr').then(function(config) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, config);

  }, function(fail) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, false);

  });

});

/**
 * Defines search form adminSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_render__searchSolr", 0, function(thisHook, data) {

  iris.modules.irisSolr.globals.renderSearchSolrForm(thisHook, data);

});

iris.modules.irisSolr.globals.renderAdminSolrForm = function(thisHook, data, config) {

  data.schema.host = {
    "type": "text",
    "title": "Host",
    "required": true,
    "default": config.host ? config.host : ""
  };

  data.schema.port = {
    "type": "text",
    "title": "Port",
    "required": true,
    "default": config.port ? config.port : ""
  };

  data.schema.core = {
    "type": "text",
    "title": "Core",
    "required": false,
    "default": config.core ? config.core : ""
  };

  data.schema.path = {
    "type": "text",
    "title": "Path",
    "required": true,
    "default": config.path ? config.path : ""
  };

  thisHook.pass(data);
}

iris.modules.irisSolr.globals.renderSearchSolrForm = function(thisHook, data) {

  data.schema.filter = {
    "type": "string",
    "title": "Search",
    "required": true,
    "default": "*:*"
  };

  thisHook.pass(data);
}

/**
 * @function indexify
 * @memberof irisSolr
 *
 */

iris.modules.irisSolr.globals.indexify = function(content) {

  var config = iris.readConfigSync('irisSolr', 'solrEntities');

  if (config[content.entityType]) {



  }

  // Ensure the solr document id is our entityType + eid.
  content['id'] = content.entityType + ':' + content.eid;

  return content;

}

/**
 * @function executeQuery
 * @memberof irisSolr
 *
 * @desc Execute a solr query command
 *
 * Wraps and simplifies the process of executing solr query e.g. create, delete and search.
 *
 * @param {string} action - type of command the query is for
 * @param {object} content - either a string query to search or delete in solr format or an object to add into solr database
 *
 * @returns a promise which, if successful, return the result object from solr.
 */

iris.modules.irisSolr.globals.executeQuery = function(action, content, callback) {

  if (action !== false) {

    try {
      if (action == "add") {
        content = iris.modules.irisSolr.globals.indexify(content);
      }

      var connection = iris.modules.irisSolr.globals.getSolrConnection(null);
      if (connection) {
        connection[action](content, function(err, obj) {

          if (err) {

            iris.log("error", "Error on query execution. Please check your query details" + JSON.stringify(err));
            callback(false);
            return false;

          } else {

            connection.commit({ waitSearcher: false }, function(err, resp) {

              if (err) {

                iris.log("error", "Error on commiting query. Please check your query permission" + JSON.stringify(err));
                callback(false);
                return false;

              } else {
                callback(obj);
                return false;
              }

            });

          }

        });
      }
      else {
        callback(false);
        return false;
      }

    } catch (e) {

      iris.log("error", "Error connecting to Solr server. Please check your connection details.", e);

      iris.message("Error connecting to Solr server. Please check your connection details.", "error");

      callback(false);
      return false;


    }
  } else {

    callback(false);
    return false;
  }
}

/**
 * Helper function to generate search result based on filter.
 */
iris.modules.irisSolr.globals.generateSearch = function(req, res) {

  var query = iris.modules.irisSolr.globals.generateQuery(req.query);

  if (query) {

    iris.modules.irisSolr.globals.executeQuery("search", query, function(result) {

      if (result) {

        var markup = "";
        var done = function() {

          iris.modules.frontend.globals.parseTemplateFile(['solrsearch'], ['html'], { results: markup }, req.authPass, req)

            .then(function(output) {

              res.send(output);

            }, function(fail) {

              iris.modules.frontend.globals.displayErrorPage(500, req, res);
              iris.log("error", fail);

            });


        }

        var count = result.response.docs.length,
          counter = 0;

        var next = function() {

          counter += 1;

          if (counter >= count) {

            done();

          }


        }

        result.response.docs.forEach(function(result) {

          var entityQuery = {
            entities: [result.entityType[0]],
            queries: [{
              field: 'eid',
              operator: 'IS',
              value: result.eid[0]
            }]
          };
          iris.invokeHook("hook_entity_fetch", req.authPass, null, entityQuery)
            .then(function(entity) {

              if (entity[0]) {
                iris.modules.frontend.globals.parseTemplateFile(['solrresult', result.entityType[0]], null, entity[0], req.authPass, req)

                  .then(function(output) {
                    markup += output;
                    next();

                  }, function(fail) {
                    iris.modules.frontend.globals.displayErrorPage(500, req, res);
                    iris.log("error", fail);

                  });
              }
              else {
                next();
              }

            }, function(fail) {
              next();
              iris.log("error", fail);

            });

        });
        if (result.response.docs.length == 0) {
          next();
        }

      }
      else {

        return false;
      }
    });
  }
  else {

    return false;
  }
};

/**
 * Helper function to generate filter base from url.
 */
iris.modules.irisSolr.globals.generateQuery = function(content) {

  var connection = iris.modules.irisSolr.globals.getSolrConnection(null);
  if (connection) {
    return connection.createQuery()
      .q(content.filter)
      .start(content.start || 0)
      .rows(content.rows || 10)
  }
  else {
    return false;
  }

};

/**
 * Initialize the connection object.
 */
iris.modules.irisSolr.globals.getSolrConnection = function(config) {

  config = config || iris.readConfigSync('irisSolr', 'adminSolr');
  if (config) {
    try {

      var solr = require('solr-client');

      return solr.createClient({
        host: config.host,
        port: config.port,
        core: config.core,
        path: config.path
      });

    } catch (e) {

      iris.log("error", "Error connecting to Solr server. Please check your connection details.", e);

      iris.message("Error connecting to Solr server. Please check your connection details.", "error");

      return false;

    }
  }
  else {

    iris.log("error", "Error reading configuration file. irisSolr : adminSolr" + fail);

    iris.message("Error reading configuration file. irisSolr : adminSolr", "error");

    return false;

  }
};

/**
 * Submit handler for adminSolr.
 * Saves Solr connection details to config.
 */
iris.modules.irisSolr.registerHook("hook_form_submit__adminSolr", 0, function(thisHook, data) {

  var content = 'title_t:Hello';

  iris.saveConfig(thisHook.context.params, 'irisSolr', 'adminSolr');

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", content, function(data) {

    if (data.responseHeader && data.responseHeader.status == 0) {

      iris.message(thisHook.authPass.userid, "Connection successful", "info");

    } else {

      iris.message(thisHook.authPass.userid, "Connection failed", "info");

    }

    thisHook.pass(data);

  });

});

/**
 * Submit handler for searchSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_submit__searchSolr", 0, function(thisHook, data) {

  const queryString = require('query-string');

  var path = queryString.stringify(thisHook.context.params);

  thisHook.pass(function(res) {

    res.send({
      redirect: '/search?' + path
    });
  });


});

var flatten = function(content) {
  var result = {};

  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      if(result[prop]){
        if(Array.isArray(result[prop])){
        }
        else{
          result[prop] = [result[prop]]      ;
          result[prop].push(cur);
        }
      }
      else{
        result[prop] = cur;
      }
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(content, "");
  return result;
}


/**
 * Create record handler for Solr.
 */

iris.modules.irisSolr.registerHook("hook_entity_create", 1, function (thisHook, data) {

  var config = iris.readConfigSync('irisSolr', 'solrEntities');

  if (config[data.entityType] && config[data.entityType].indexEntity === true) {

    var flat = iris.modules.irisSolr.globals.flatten(data);

    iris.modules.irisSolr.globals.executeQuery("add", flat, function (resp) {

      thisHook.pass(data);

    });
  }
  else {

    thisHook.pass(data);

  }

});

var filterFields = function(content, config) {

  Object.keys(content).forEach(function(field) {

    if (config.fields[field].indexField != 'index') {

      delete content[field];

    }

  })

  return content;
}

/**
 * Update record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_updated", 1, function(thisHook, data) {

  var config = iris.readConfigSync('irisSolr', 'solrEntities');

  if (config[data.entityType] && config[data.entityType].indexEntity === true) {

    var flat = iris.modules.irisSolr.globals.flatten(data);

    flat = filterFields(flat, config[data.entityType]);

    iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'eid:' + data.eid, function (resp) {

      iris.modules.irisSolr.globals.executeQuery("add", flat, function (resp) {

        thisHook.pass(data);

      });

    });
  }
  else {

    thisHook.pass(data);

  }
});

/**
 * Delete record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_deleted", 0, function(thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'eid:' + data.eid, function(resp) {

    thisHook.pass(data);

  });

});

/**
 * Register Swag handlebars helpers
 */
iris.modules.irisSolr.registerHook("hook_frontend_handlebars_extend", 1, function(thisHook, Handlebars) {

  Swag = require('swag');

  Swag.registerHelpers(Handlebars);

  thisHook.pass(Handlebars);

});

iris.modules.irisSolr.globals.flatten = function(content) {
  var result = {};

  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      if (result[prop]) {
        if (!Array.isArray(result[prop])) {
          result[prop] = [result[prop]];
        }
        result[prop].push(cur);
      }
      else {
        result[prop] = cur;
      }
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop);
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(content, "");
  return result;
}
