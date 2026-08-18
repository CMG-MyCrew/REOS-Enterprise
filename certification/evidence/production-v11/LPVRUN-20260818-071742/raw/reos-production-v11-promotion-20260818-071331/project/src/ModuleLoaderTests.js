function testModuleLoaderCRM() {
  Logger.log('1. Starting full loader test');

  var result = reosLoadModule('crm', {
    runSetup: false
  });

  Logger.log('2. Loader returned');
  Logger.log(JSON.stringify(result, null, 2));

  return result;
}