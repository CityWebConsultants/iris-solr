
iris.modules.auth.globals.registerPermission("can fetch page", "Search", "Can user search records");

var search = {
  config: {
    "title": "Search Configuration",
    "description": "Solr server connection settings",
    "permission": ["can fetch page"]
  },
  query: {
    "title": "Search query",
    "description": "search query in solr",
    "permission": ["can fetch page"]
  }
};

iris.route.get('/search', search.query, function (req, res) {

});

/**
 * Endpoint to manage Solr connection details.
 */
iris.route.get('/admin/config/search/solr', search.config, function (req, res) {
  iris.modules.frontend.globals.parseTemplateFile(["admin-solr"], ['html'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });
});

/**
 * Defines form adminSolr.
 */
iris.modules.irisSolr.registerHook("hook_form_render_adminSolr", 0, function (thisHook, data) {

  iris.readConfig('irisSolr', 'adminSolr').then(function (config) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, config);

  }, function (fail) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, false);

  });

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
    "required": true,
    "default": config.core ? config.core : ""
  };

  data.schema.path = {
    "type": "text",
    "title": "Path",
    "required": true,
    "default": config.path ? config.path : ""
  };

  thisHook.finish(true, data);
}



/**
 * Given a generated SQL query, create a Solr connection and execute the query.
 */
iris.modules.irisSolr.globals.executeQuery = function (action, content, callback) {

  if (action !== false) {

    try {

      var connection = iris.modules.irisSolr.globals.getSolrConnection(null);
      if (connection) {
        connection[action](content, function (err, obj) {

          if (err) {

            iris.log("error", "Error on query execution. Please check your query details" + JSON.stringify(err));
            callback(false);
            return false;

          } else {

            connection.commit({ waitSearcher: false }, function (err, resp) {

              callback(obj);
              return false;

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
iris.modules.irisSolr.globals.generateSearch = function (req, res, template, controller) {

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
  else{
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
iris.modules.irisSolr.registerHook("hook_form_submit_adminSolr", 0, function (thisHook, data) {

  var content = 'title_t:Hello';

  iris.saveConfig(thisHook.const.params, 'irisSolr', 'adminSolr');

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", content, function (data) {

    if (data.responseHeader && data.responseHeader.status == 0) {

      iris.message(thisHook.authPass.userid, "Connection successful", "info");

    } else {

      iris.message(thisHook.authPass.userid, "Connection failed", "info");

    }

    thisHook.finish(true, data);

  });

});

/**
 * Create record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_create", 1, function (thisHook, data) {

  data.id = data._id

  iris.modules.irisSolr.globals.executeQuery("add", data, function (resp) {

    thisHook.finish(true, data);

  });

});

/**
 * Update record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_updated", 1, function (thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'id:' + data.eid, function (resp) {

    data.id = data._id

    iris.modules.irisSolr.globals.executeQuery("add", data, function (resp) {

      thisHook.finish(true, data);

    });

  });
});

/**
 * Delete record handler for Solr.
 */
iris.modules.irisSolr.registerHook("hook_entity_delete", 1, function (thisHook, data) {

  iris.modules.irisSolr.globals.executeQuery("deleteByQuery", 'id:' + data.eid, function (resp) {

    thisHook.finish(true, data);

  });

});
