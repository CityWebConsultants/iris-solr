
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
 * Input coneection details for Mysql database
 */
iris.modules.irisSolr.registerHook("hook_form_render_adminSolr", 0, function (thisHook, data) {

  iris.readConfig('irisSolr', 'adminSolr').then(function (config) {

    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, config);

  }, function (fail) {
    console.log("fail", fail);
    iris.modules.irisSolr.globals.renderAdminSolrForm(thisHook, data, false);

  });

});

iris.modules.irisSolr.globals.renderAdminSolrForm = function (thisHook, data, config) {
  console.log(data);
  console.log(config);
  data.schema.host = {
    "type": "text",
    "title": "Solr server host",
    "required": true,
    "default": config.host ? config.host : ""
  };
  data.schema.port = {
    "type": "text",
    "title": "Solr server port",
    "required": true,
    "default": config.port ? config.port : ""
  };
  data.schema.core = {
    "type": "text",
    "title": "Solr server core",
    "required": true,
    "default": config.core ? config.core : ""
  };
  data.schema.path = {
    "type": "text",
    "title": "Solr server path",
    "required": true,
    "default": config.path ? config.path : ""
  };

  thisHook.finish(true, data);
}

/**
 * Submit handler for adminSolr.
 * Saves Solr connection details to config.
 */
iris.modules.irisSolr.registerHook("hook_form_submit_adminSolr", 0, function (thisHook, data) {

  var queryString = 'SHOW VARIABLES';

  iris.saveConfig(thisHook.const.params, 'irisSolr', 'adminSolr');

  iris.modules.irisSolr.globals.executeQuery(queryString, thisHook.const.req, function (data) {

    if (data.fields && data.fields.length > 0) {

      iris.message(thisHook.authPass.userid, "Connection successful", "info");

    } else {

      iris.message(thisHook.authPass.userid, "Connection failed", "info");

    }

    thisHook.finish(true, data);

  });

});

/**
 * Given a generated SQL query, create a Solr connection and execute the query.
 */
iris.modules.irisSolr.globals.executeQuery = function (queryString, req, callback) {

  if (queryString !== false) {

    iris.readConfig('irisSolr', 'adminSolr').then(function (config) {

      console.log("config", config);

      try {

        var connection = iris.modules.irisSolr.globals.getSolrConnection(config);
        var query = 'title_t:Hello';
        connection.deleteByQuery(query, function (err, obj) {
          if (err) {
            console.log("error", "Error connecting to Solr server. Please check your connection details" + JSON.stringify(err));
            return callback(false);
          } else {
            return callback(obj);
          }
        });



      } catch (e) {

        console.log("error", "Error connecting to Solr server. Please check your connection details" + JSON.stringify(e));

        iris.message(req.authPass.userid, "Error connecting to Solr server. Please check your connection details.", "error");

        return callback(false);


      }
    }, function (fail) {

      console.log("error", "Error connecting to Solr server. Please check your connection details" + fail);

      iris.message(req.authPass.userid, "Error connecting to Solr server. Please check your connection details", "error");

      return callback(false);


    });
  } else {

    return callback(false);
  }
}

/**
 * Initialize the connection object.
 * TODO: Create an admin form to enter DB details instead of hard-coding them.
 */
iris.modules.irisSolr.globals.getSolrConnection = function (config) {

  console.log(config);
  var solr = require('solr-client');
  var client = solr.createClient({
    host: config.host,
    port: config.port,
    core: config.core,
    path: config.path
  });

  return client;
};

iris.hook("hook_entity_view", "root").then(function (data) {
  console.log("i am callled from solr", data);
});