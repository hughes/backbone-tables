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
            paginate: false,
            items_per_page: 20,
            page: 1
        },
        sort: function (index, reverse) {
            var items, key, comparator;

            items = this.get('items');

            // set the collection to use a new comparator
            // it will look at the data corresponding to the 
            key = this.get('columns')[index].data;
            comparator = function (a, b) {
                var first, second, result;
                first = a.get(key); second = b.get(key);
                result = first > second ? 1 : first === second ? 0 : -1;
                if (reverse) {
                    result = -result;
                }
                return result;
            };
            items.comparator = comparator;
            items.sort();
        }
    });
    Backbone.TableView = Backbone.View.extend({
        tagName: 'table',
        events: {
            'click th': 'sort',
            'click .prev': 'prev_page',
            'click .next': 'next_page',
            'click .first': 'first_page',
            'click .last': 'last_page'
        },
        initialize: function () {
            this.model.bind('change:page', this.render_foot, this);
            this.model.bind('change:page', this.render_body, this);
            this.model.get('items').bind('add remove', this.render_foot, this);
            this.model.get('items').bind('add remove', this.render_body, this);
        },
        last_page: function () {
            this.model.set({
                page: Math.ceil(this.model.get('items').length / this.model.get('items_per_page'))
            });
        },
        first_page: function () {
            this.model.set({
                page: 1
            });
        },
        next_page: function () {
            this.model.set({
                page: Math.max(1, this.model.get('page') + 1)
            });
        },
        prev_page: function () {
            this.model.set({
                page: Math.max(1, this.model.get('page') - 1)
            });
        },
        sort: function (event) {
            var target, index, reverse;
            target = $(event.target);
            index = target.attr('index');
            reverse = target.attr('sort') === 'down';

            this.model.sort(index, reverse);

            // set the 'sort' attribute
            this.$('>tr>th[sort]').removeAttr('sort');
            target.attr('sort', reverse ? 'up' : 'down');

            this.render_body();
        },
        render: function () {
            this.caption = $('<caption></caption>');
            this.head = $('<thead></thead>');
            this.body = $('<tbody></tbody>');
            this.foot = $('<tfoot></tfoot>');
            this.$el.append(this.caption);
            this.$el.append(this.head);
            this.$el.append(this.body);
            this.$el.append(this.foot);
            this.render_caption();
            this.render_head();
            this.render_body();
            this.render_foot();
        },
        render_caption: function () {
            var caption_html = '';
            this.caption.html(caption_html);
        },
        render_head: function () {
            var head_html = '<tr>';
            _.each(this.model.get('columns'), function (column, index) {
                head_html += '<th index="' + index + '">' + column.title + '</th>';
            });
            head_html += '</tr>';
            this.head.html(head_html);
        },
        render_body: function () {
            var body_html, keys, first, last, i, item, cell_func, row_html;
            body_html = '';
            keys = _.pluck(this.model.get('columns'), 'data');

            first = 0; last = this.model.get('items').length;
            if (this.model.get('paginate')) {
                first = (this.model.get('page') - 1) * this.model.get('items_per_page');
                last = Math.min(last, first + this.model.get('items_per_page'));
            }

            cell_func = function (key) {
                row_html += '<td>' + item.get(key) + '</td>';
            };

            for (i = first; i < last; i += 1) {
                item = this.model.get('items').at(i);
                row_html = '<tr>';
                _.each(keys, cell_func);
                row_html += '</tr>';
                body_html += row_html;
            }

            this.body.html(body_html);
        },
        render_foot: function () {
            var foot_html, last_page;
            foot_html = '';
            if (this.model.get('paginate')) {
                last_page = Math.max(1, Math.ceil(this.model.get('items').length / this.model.get('items_per_page')));
                if (this.model.get('page') > 1) {
                    foot_html += '<a href="#" class="first">&laquo;</a>';
                    foot_html += '<a href="#" class="prev">&lt;</a>';
                } else {
                    foot_html += '&laquo;'
                    foot_html += '&lt;'
                }
                foot_html += 'Page ' + (this.model.get('page'));
                foot_html += ' of ' + last_page;
                if (this.model.get('page') < last_page) {
                    foot_html += '<a href="#" class="next">&gt;</a>';
                    foot_html += '<a href="#" class="last">&raquo;</a>';
                } else {
                    foot_html += '&gt;'
                    foot_html += '&raquo;'
                }
            }
            this.foot.html(foot_html);
        }
    });
}());