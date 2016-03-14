
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
  index_config :  {
    "title": "Search Field Configuration",
    "description": "Define each field index and search boost",
    "permission": ["can fetch page"]
  }
  
};

iris.route.get('/search', search.query, function (req, res) {
  iris.modules.irisSolr.globals.generateSearch(req, res);
});

/**
 * Endpoint to manage Solr connection details.
 */
iris.route.get('/admin/config/search/solr', search.connection_config, function (req, res) {
  
  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }
  
  iris.modules.frontend.globals.parseTemplateFile(["solrconnection"], ['admin_wrapper'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });
});

/**
 * TODO : it display just a copy paste content list of entities 
 */
iris.route.get("/admin/config/search/solr/entities", search.index_config, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["solrentities"], ['admin_wrapper'], {
    entityTypes: Object.keys(iris.dbCollections)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * TODO : it display just a copy paste content schema not working yet :(
 */
iris.route.get("/admin/config/search/solr/:type/manage-fields", search.index_config, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema_manage_fields template.
  iris.modules.frontend.globals.parseTemplateFile(["solr_entities_manage_index"], ['admin_wrapper'], {
    entityType: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * TODO : this one is just to render page yet not working 
 * Endpoint to manage Solr index config details.
 */
iris.route.get('/admin/config/search/solr/fields', search.index_config, function (req, res) {
  
  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }
  
  iris.modules.frontend.globals.parseTemplateFile(["solrindex"], ['html'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });
});

/**
 * Defines configuration form adminSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_render__adminSolr", 0, function (thisHook, data) {

  iris.readConfig('irisSolr', 'adminSolr').then(function (config) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, config);

  }, function (fail) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, false);

  });

});

/**
 * Defines search form adminSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_render__searchSolr", 0, function (thisHook, data) {

  iris.modules.irisSolr.globals.renderSearchSolrForm(thisHook, data);

});

iris.modules.irisSolr.globals.renderAdminSolrForm = function (thisHook, data, config) {

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

iris.modules.irisSolr.globals.renderSearchSolrForm = function (thisHook, data) {

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

iris.modules.irisSolr.globals.indexify = function (content) {
 /* if (typeof content === 'object') {
    var ncontent = {};
    for (var i in content) {
      switch (true) {
        case ((typeof content[i]) === "string" && !(/^\d+$/.test(content[i]))):
          ncontent[i + "_t"] = content[i];
          break;
        case ((typeof content[i]) === "boolean"):
          ncontent[i + "_b"] = content[i];
          break;
        case ((typeof content[i]) === "date"):
          ncontent[i + "_dt"] = content[i];
          break;
        case ((typeof content[i]) === "number"):
          ncontent[i + "_i"] = content[i];
          break;
        case (i === '_id'):
          ncontent['id'] = content[i].toString();
          break;
        case /^\d+$/.test(content[i]):
          ncontent[i + "_i"] = Number(content[i]);
          break;
        default:
          ncontent[i] = content[i];
      }
    }
    return ncontent;
  }
  else {
    return content;
  }*/
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

iris.modules.irisSolr.globals.executeQuery = function (action, content, callback) {

  if (action !== false) {

    try {
      if(action == "add"){
        content = iris.modules.irisSolr.globals.indexify(content);
      }

      var connection = iris.modules.irisSolr.globals.getSolrConnection(null);
      if (connection) {
        connection[action](content, function (err, obj) {

          if (err) {

            iris.log("error", "Error on query execution. Please check your query details" + JSON.stringify(err));
            callback(false);
            return false;

          } else {

            connection.commit({ waitSearcher: false }, function (err, resp) {

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
iris.modules.irisSolr.globals.generateSearch = function (req, res) {

  var query = iris.modules.irisSolr.globals.generateQuery(req.query);

  if (query) {

    iris.modules.irisSolr.globals.executeQuery("search", query, function (result) {
    
      if (result) {

        var markup = "";
        var done = function () {

          iris.modules.frontend.globals.parseTemplateFile(['solrsearch'], ['html'], {results: markup}, req.authPass, req)

            .then(function (output) {

              res.send(output);

            }, function (fail) {

              iris.modules.frontend.globals.displayErrorPage(500, req, res);
              iris.log("error", fail);

            });


        }

        var count = result.response.docs.length,
          counter = 0;

        var next = function () {

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
            .then(function (entity) {

              if (entity[0]) {
                iris.modules.frontend.globals.parseTemplateFile(['solrresult', result.entityType[0]], null, entity[0], req.authPass, req)

                  .then(function (output) {
                    markup += output;
                    next();

                  }, function (fail) {
                    iris.modules.frontend.globals.displayErrorPage(500, req, res);
                    iris.log("error", fail);

                  });
              }
              else {
                next();
              }

            }, function (fail) {
              next();
              iris.log("error", fail);

            });

        });
        if(result.response.docs.length == 0){
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
iris.modules.irisSolr.globals.generateQuery = function (content) {

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
iris.modules.irisSolr.globals.getSolrConnection = function (config) {

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
iris.modules.irisSolr.registerHook("hook_form_submit__adminSolr", 0, function (thisHook, data) {

  var content = 'title_t:Hello';

  iris.saveConfig(thisHook.context.params, 'irisSolr', 'adminSolr');

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", content, function (data) {

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
iris.modules.irisSolr.registerHook("hook_form_submit__searchSolr", 0, function (thisHook, data) {

  const queryString = require('query-string');

  var path = queryString.stringify(thisHook.context.params);

  thisHook.pass(function (res) {

    res.send({
      redirect: '/search?' + path
    });
  });


});

/**
 * Create record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_create", 1, function (thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("add", data, function (resp) {

    thisHook.pass(data);

  });

});

/**
 * Update record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_updated", 1, function (thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'eid_i:' + data.eid, function (resp) {

    iris.modules.irisSolr.globals.executeQuery("add", data, function (resp) {

      thisHook.pass(data);

    });

  });
});

/**
 * Delete record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'eid_i:' + data.eid, function (resp) {

    thisHook.pass(data);

  });

});

/**
 * Register Swag handlebars helpers
 */
iris.modules.irisSolr.registerHook("hook_frontend_handlebars_extend", 1, function (thisHook, Handlebars) {

  Swag = require('swag');

  Swag.registerHelpers(Handlebars);

  thisHook.pass(Handlebars);

});

/** 
 * TODO : This one is just copied from schemaui and is not working yet :(
*/
iris.modules.irisSolr.registerHook("hook_form_render__indexFieldListing", 0, function (thisHook, data) {


  if (thisHook.context.params[1]) {

    var entityType = thisHook.context.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.fail(data);

      return false;

    }


    var entityTypeSchema = iris.dbSchemaConfig[entityType];
    // Parent is required to know which fields to list.
    var parent = thisHook.context.params[2];

    if (parent) {

      var recurseFields = function (object, elementParent) {

          for (element in object) {

            if (element == parent) {

              parentSchema = object[element];
              fields = object[element].subfields;

              return;

            } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

              recurseFields(object[element].subfields, element);

            }

          };
        }
        // Do recursion to find the desired fields to list as they may be nested.
      recurseFields(entityTypeSchema.fields, parent);

    } else {
      parentSchema = entityTypeSchema.fields;
      fields = entityTypeSchema.fields;
    }

    var rows = [];
    var weightsList = [];

    // Loop over each field to add to the table.
    Object.keys(fields).forEach(function (fieldName) {

      var row = {};

      if (!parentSchema.subfields) {
        var field = JSON.parse(JSON.stringify(parentSchema[fieldName]));
      } else {
        var field = JSON.parse(JSON.stringify(parentSchema.subfields[fieldName]));
      }


      row['fieldLabel'] = field.label;
      row['fieldId'] = fieldName;
      row['fieldType'] = field.fieldType;
      row['fieldWeight'] = field.weight;
      row['fieldEdit'] = '<a href="/admin/config/solr/' + entityType + '/' + fieldName + '" >Edit</a>';
      row['fieldDelete'] = '<a href="/admin/config/solr/' + entityType + '/' + fieldName + '/delete" >Delete</a>';
      rows.push(row);

      // Currently a hacky way to alter the weights of fields, this creates a fidden field that gets updated
      // when the user re-orders the table.
      weightsList.push({
        "machineName": 'weight_' + fieldName,
        "weight": field.weight
      });
    });

    // Order the rows by weight.
    rows.sort(function (a, b) {

      if (a.fieldWeight > b.fieldWeight) {

        return 1;

      } else if (a.fieldWeight < b.fieldWeight) {

        return -1;

      } else {

        return 0;

      }

    });

    // Generate table markup. This should be replaced with a handlebars wrapper that generates a table from JSON.
    var tableHtml = '<table>' +
      '<thead>' +
      '<th></th>' +
      '<th>Label</th>' +
      '<th>Machine name</th>' +
      '<th>Type</th>' +
      '<th>Edit</th>' +
      '<th>Delete</th>' +
      '</thead>' +
      '<tbody class="ui-sortable">';
    var counter = 0;
    rows.forEach(function (tableRow) {

      tableHtml += '<tr>';
      tableHtml += '<td><span class="glyphicon glyphicon-resize-vertical"></span></td>';
      for (tableCell in tableRow) {
        tableHtml += "<td class=\"" + tableCell + "\">" + tableRow[tableCell] + "</td>";
      };

      tableHtml += '</tr>';

    });
    tableHtml += '</tbody></table>';



    var weightFields = {
      "type": "array",
      "title": "weights",
      "items": {
        "type": "object",
        "properties": {
          "weight": {
            "type": "number",
          },
          "machineName": {
            "type": "hidden"
          }
        }
      }
    };

    data.schema = {
      "table": {
        "type": "markup",
        "markup": tableHtml
      },
      weightFields,
      "label": {
        "type": "text",
        "title": "Field label"
      },
      "machineName": {
        "type": "text",
        "title": "Database name",
      },
      "fieldType": {
        "type": "text",
        "title": "Field type",
        "enum": Object.keys(iris.fieldTypes).concat(["Fieldset"])
      },
      "entityType": {
        "type": "hidden",
      },
      parentItem: {
        "type": "hidden",
      }
    };

    data.form = [
      "table",
      "weightFields",
      "entityType",
      "parentItem",
      {
        "type": "fieldset",
        "title": "Add new field",
        "expandable": true,
        "items": [
          {
            "key": "label",
            "onKeyUp": function (evt, node) {
              var label = $("input[name=label]").val();
              label = label.replace(/[^a-zA-Z]+/g, "_").toLowerCase();
              $('#machineNameBuilder').html(label);
              $("input[name=machineName]").val(label);
            }
          },
          {
            "key": "machineName",
            "onInsert": function (evt, node) {
              $("input[name=machineName]").before("<div id=\"machineNameBuilder\"></div>");
            }
          },
          "fieldType"
        ]
      },
      {
        "type": "submit",
        "title": "Save"
      }
    ];

    data.value.parentItem = parent;
    data.value.weightFields = weightsList;
    data.value.entityType = entityType;

    thisHook.pass(data);
  } else {
    thisHook.fail(data);
    iris.log("error", "No entityType field passed to hook_form_render__schemaFieldListing");
  }

});

