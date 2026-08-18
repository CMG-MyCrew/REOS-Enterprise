function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  template.request = e || {};
  template.parameters = (e && e.parameter) || {};

  return template
    .evaluate()
    .setTitle('REOS Enterprise')
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1, viewport-fit=cover'
    );
}
