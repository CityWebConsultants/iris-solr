# IrisJS.org - Apache solr search integration for the IrisJS framework

## How to install
```

1. Install Apache Solr.
  See https://cwiki.apache.org/confluence/display/solr/Installing+Solr and https://cwiki.apache.org/confluence/display/solr/Running+Solr
2. A core will be required in solr, for the purpose of these instructions we will call it 'iris'
3. Run 'npm install irisjs-apachesolr' in your project.
4. In your Iris site enable to the solr module at /admin/modules
```

## Configure solr
```
At /admin/config/search/solr enter the connection details for you solr instance. Eg;
host: 127.0.0.1
port: 8983
core: iris
path: /solr

Go to /admin/config/search/solr/entities to choose which entities and fields should be indexed.
```

```
## How to use

```
1. Add or Update an entity
2. Navigate to /search
3. Search for an entity that you have added eg:
   For keyword search ?filter=foo
   or field specific searchs ?filter=fieldname:foo
4. enjoy and help improve the search POC page
```