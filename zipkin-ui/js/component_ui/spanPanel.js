import {component} from 'flightjs';
import $ from 'jquery';
import {Constants} from './traceConstants';

// Normal values are formatted in traceToMustache. However, Quoted json values
// end up becoming javascript objects later. For this reason, we have to guard
// and stringify as necessary.

// annotations are named events which shouldn't hold json. If someone passed
// json, format as a single line. That way the rows corresponding to timestamps
// aren't disrupted.
export function formatAnnotationValue(value) {
  const type = $.type(value);
  if (type === 'object' || type === 'array') {
    return JSON.stringify(value);
  } else {
    return value;
  }
}

// Binary annotations are tags, and sometimes the values are large, for example
// json representing a query or a stack trace. Format these so that they don't
// scroll off the side of the screen.
export function formatBinaryAnnotationValue(value) {
  const type = $.type(value);
  if (type === 'object' || type === 'array') {
    return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
  } else {
    return value;
  }
}

export default component(function spanPanel() {
  this.$annotationTemplate = null;
  this.$binaryAnnotationTemplate = null;
  this.$moreInfoTemplate = null;

  this.show = function(e, span) {
    const self = this;

    this.$node.find('.modal-title').text(
      `${span.serviceName}.${span.spanName}: ${span.durationStr}`);

    this.$node.find('.service-names').text(span.serviceNames);

    const $annoBody = this.$node.find('#annotations tbody').text('');
    $.each((span.annotations || []), (i, anno) => {
      const $row = self.$annotationTemplate.clone();
      if (anno.value === Constants.ERROR) {
        $row.addClass('anno-error-transient');
      }
      $row.find('td').each(function() {
        const $this = $(this);
        const propertyName = $this.data('key');
        const text = propertyName === 'value'
          ? formatAnnotationValue(anno.value)
          : anno[propertyName];
        $this.append(text);
      });
      $annoBody.append($row);
    });

    $annoBody.find('.local-datetime').each(function() {
      const $this = $(this);
      const timestamp = $this.text();
      $this.text((new Date(parseInt(timestamp, 10) / 1000)).toLocaleString());
    });

    const $binAnnoBody = this.$node.find('#binaryAnnotations tbody').text('');
    $.each((span.binaryAnnotations || []), (i, anno) => {
      const $row = self.$binaryAnnotationTemplate.clone();
      if (anno.key === Constants.ERROR) {
        $row.addClass('anno-error-critical');
      }
      $row.find('td').each(function() {
        const $this = $(this);
        const propertyName = $this.data('key');
        const text = propertyName === 'value'
          ? formatBinaryAnnotationValue(anno.value)
          : anno[propertyName];
        $this.append(text);
      });
      $binAnnoBody.append($row);
    });

    const $moreInfoBody = this.$node.find('#moreInfo tbody').text('');
    const moreInfo = [['traceId', span.traceId],
                       ['spanId', span.id]];
    $.each(moreInfo, (i, pair) => {
      const $row = self.$moreInfoTemplate.clone();
      $row.find('.key').text(pair[0]);
      $row.find('.value').text(pair[1]);
      $moreInfoBody.append($row);
    });

    this.$node.modal('show');
  };

  this.after('initialize', function() {
    this.$node.modal('hide');
    this.$annotationTemplate = this.$node.find('#annotations tbody tr').remove();
    this.$binaryAnnotationTemplate = this.$node.find('#binaryAnnotations tbody tr').remove();
    this.$moreInfoTemplate = this.$node.find('#moreInfo tbody tr').remove();
    this.on(document, 'uiRequestSpanPanel', this.show);
  });
});
