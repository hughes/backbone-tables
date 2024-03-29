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
        Column: Backbone.Model.extend(),
        defaults: {
            columns: [],
            items: undefined,
            paginate: false,
            items_per_page: 10,
            page: 1,
            filter: false,
            filter_value: ''
        },
        initialize: function () {
            this.set({
                columns: new (Backbone.Collection.extend({
                    model: this.Column
                }))(this.get('columns'))
            });
            this.bind('change:filter_value change:items_per_page change:page change:filter', this.clamp_page, this);
        },
        clamp_page: function () {
            this.set({
                page: Math.max(1, Math.min(this.get_last_page(), this.get('page')))
            });
        },
        get_last_page: function () {
            return Math.max(1, Math.ceil(this.filtered().length / this.get('items_per_page')));
        },
        sort: function (index, reverse) {
            var items, key, comparator;

            items = this.get('items');

            // set the collection to use a new comparator
            // it will look at the data corresponding to the 
            key = this.get('columns').at(index).get('data');
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
        },
        filtered: function () {
            var keys = this.get('columns').pluck('data'), value = this.get('filter_value');
            if (!value || !this.get('filter')) {
                return this.get('items').toArray();
            }
            return this.get('items').filter(function (item) {
                var i, match = false;
                for (i = 0; i < keys.length; i += 1) {
                    if (String(item.get(keys[i])).toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                        match = true;
                        break;
                    }
                }
                return match;
            });
        }
    });
    Backbone.TableView = Backbone.View.extend({
        tagName: 'table',
        className: 'table',
        events: {
            'click th': 'sort',
            'click .prev': 'prev_page',
            'click .next': 'next_page',
            'click .first': 'first_page',
            'click .last': 'last_page',
            'change .filter': 'filter'
        },
        initialize: function () {
            this.model.bind('change:page', this.render_foot, this);
            this.model.bind('change:page', this.render_body, this);
            this.model.get('items').bind('add remove', this.render_foot, this);
            this.model.get('items').bind('add remove', this.render_body, this);
            this.model.bind('change:filter_value', this.render_foot, this);
            this.model.bind('change:filter_value', this.render_body, this);
            this.model.get('items').bind('change', this.render_body, this);
            this.model.bind('change:paginate', this.render_body, this);
            this.model.bind('change:paginate', this.render_foot, this);
            this.model.bind('change:items_per_page', this.render_body, this);
            this.model.bind('change:items_per_page', this.render_foot, this);
            this.model.bind('change:filter', this.render, this);
            this.model.get('columns').bind('change add remove', this.render, this);
        },
        filter: function (event) {
            this.model.set({
                filter_value: $(event.target).val()
            });
        },
        last_page: function () {
            this.model.set({
                page: this.model.get_last_page()
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
            this.$('>thead>tr>th[sort]').removeClass('btn').removeAttr('sort');
            this.$('>thead span.caret').remove();
            target.attr('sort', reverse ? 'up' : 'down');
            target.append('<span class="caret"></span>').addClass(reverse ? "up" : "");

            this.render_body();
        },
        render: function () {
            this.$el.empty();
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
            var head_row = $('<tr></tr>');
            this.model.get('columns').each(function (column, index) {
                head_row.append('<th index="' + index + '">' + column.get('title') + '</th>');
            });
            this.head.empty().append(head_row);
        },
        render_body: function () {
            var first, last, i, item, cell_func, filtered, row;

            filtered = this.model.filtered();
            first = 0; last = filtered.length;

            if (this.model.get('paginate')) {
                first = (this.model.get('page') - 1) * this.model.get('items_per_page');
                last = Math.min(last, first + this.model.get('items_per_page'));
            }

            cell_func = function (column) {
                var cell = $('<td></td>');
                // use the column's render function if it exists
                if (typeof column.get('render') === 'function') {
                    cell.append(column.get('render')(item));
                } else {
                    cell.append(item.get(column.get('data')));
                }
                row.append(cell);
            };

            this.body.empty();
            for (i = first; i < last; i += 1) {
                item = filtered[i];
                row = $('<tr></tr>');
                this.model.get('columns').each(cell_func);
                this.body.append(row);
            }
        },
        render_foot: function () {
            var foot_html, last_page;
            foot_html = '<tr><td colspan="100%"><div class="btn-group">';
            if (this.model.get('paginate')) {
                last_page = this.model.get_last_page();
                foot_html += '<button class="btn first">&laquo;</button>';
                foot_html += '<button class="btn prev">&lt;</button>';
                foot_html += '<button disabled="disabled" class="btn">Page ' + (this.model.get('page'));
                foot_html += ' of ' + last_page;
                foot_html += '<button class="btn next">&gt;</button>';
                foot_html += '<button class="btn last">&raquo;</button>';
            }
            foot_html += '</div>';
            if (this.model.get('filter')) {
                foot_html += '<div class="right">Filter <input class="filter" value="' + this.model.get('filter_value')+'" /></div>';
            }
            foot_html += "</td></tr>"
            this.foot.html(foot_html);
        }
    });
}());