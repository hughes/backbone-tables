/*global Backbone:false, _:false, $:false */
/**
 * Backbone-tables.js 0.0.0
 * by Matt Hughes
 */
(function () {
    "use strict";
    var _, Backbone;
    _ = window._;
    Backbone = window.Backbone;
    Backbone.Table = Backbone.Model.extend({
        defaults: {
            columns: [],
            items: undefined,
        },
    });
    Backbone.TableView = Backbone.View.extend({
        tagName: 'table',
        render: function () {
            this.head = $('<thead></thead>');
            this.body = $('<tbody></tbody>');
            this.foot = $('<tfoot></tfoot>');
            this.$el.append(this.head);
            this.$el.append(this.body);
            this.$el.append(this.foot);
            this.render_head();
            this.render_body();
            this.render_foot();
        },
        render_head: function () {
            var head_html = '<tr>';
            _.each(this.model.get('columns'), function (column, index) {
                head_html += '<th index="'+index+'">' + column.title + '</th>';
            });
            head_html += '</tr>';
            this.head.html(head_html);
        },
        render_body: function () {
            var body_html = '';
            var keys = _.pluck(this.model.get('columns'), 'data');
            this.model.get('items').each(function (item) {
                var row_html = '<tr>';
                _.each(keys, function(key) {
                    row_html += '<td>' + item.get(key) + '</td>';
                });
                row_html += '</tr>';
                body_html += row_html;
            });
            this.body.html(body_html);
        },
        render_foot: function () {

        }
    });
}());