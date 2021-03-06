/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-richtext-view', function (Y) {
    "use strict";
    /**
     * Provides the RichText field view class
     *
     * @module ez-richtext-view
     */
    Y.namespace('eZ');

    /**
     * The field view to display RichText fields
     *
     * @namespace eZ
     * @class RichTextView
     * @constructor
     * @extends eZ.FieldView
     * @uses eZ.Processable
     */
    Y.eZ.RichTextView = Y.Base.create('richtextView', Y.eZ.FieldView, [Y.eZ.Processable], {
        events: {
            '[href^="ezlocation://"]': {
                'tap': '_navigateTo',
            }
        },

        initializer: function () {
            /**
             * Stores the parsed document from the xhtml5edit version of the
             * rich text field. `null` means the document is invalid.
             *
             * @property _document
             * @type {Document|Null}
             * @protected
             */
            this._document =  this._getDOMDocument();
            this._processEvent = 'activeChange';
        },


        /**
         * Checks if the internal link is valid ie it has the REST Location id
         * and the main language code in data attributes.
         *
         * @method _isValidInternalLink
         * @private
         * @param {Node} link
         * @return {Boolean}
         */
        _isValidInternalLink: function (link) {
            return (
                link.hasAttribute('data-ez-rest-location-id')
                && link.hasAttribute('data-ez-main-language-code')
            );
        },

        /**
         * tap event handler on internal link (`ezlocation://`). If the link is
         * valid, it fires `navigateTo` event so that the application navigates
         * to the corresponding Location.
         *
         * @method _navigateTo
         * @protected
         * @param {EventFacade} e
         */
        _navigateTo: function (e) {
            var link = e.target;

            e.preventDefault();
            if ( this._isValidInternalLink(link) ) {
                this.fire('navigateTo', {
                    route: {
                        name: 'viewLocation',
                        params: {
                            id: link.getAttribute('data-ez-rest-location-id'),
                            languageCode: link.getAttribute('data-ez-main-language-code'),
                        },
                    },
                });
            }
        },

        _getFieldValue: function () {
            var forEach = Array.prototype.forEach;

            if ( !this._document ) {
                return null;
            }

            // make sure the div representing an embed element has some content
            // this is to avoid the browser to misinterpret <div/> in the
            // markup
            forEach.call(this._document.querySelectorAll('[data-ezelement="ezembed"]:empty'), function (div) {
                div.textContent = " ";
            });

            return (new XMLSerializer()).serializeToString(this._document.documentElement);
        },

        /**
         * Checks whether the field value is empty. A RichText field is
         * considered empty if its content was successfully parsed and if the
         * *root* `section` element has no child.
         *
         * @method _isFieldEmpty
         * @protected
         * @return {Boolean}
         */
        _isFieldEmpty: function () {
            return (this._document && this._document.documentElement.childNodes.length === 0);
        },

        /**
         * Returns an additional `parseError` variable indicating whether the
         * xhtml5edit version of the rich text field was successfully parsed.
         *
         * @method _variables
         * @protected
         * @return {Object}
         */
        _variables: function () {
            return {
                parseError: (this._document === null),
            };
        },

        /**
         * Returns a Document object or null is the parser failed to load the
         * xhtml5edit version of the rich text field.
         *
         * @method _getDOMDocument
         * @return {Document}
         */
        _getDOMDocument: function () {
            var doc = (new DOMParser()).parseFromString(this.get('field').fieldValue.xhtml5edit, "text/xml");

            if ( !doc || !doc.documentElement || doc.documentElement.nodeName === "parsererror" ) {
                console.warn(
                    "Unable to parse the content of the RichText field #" + this.get('field').id
                    );
                return null;
            }
            return doc;
        },
    }, {
        ATTRS: {
            processors: {
                valueFn: function () {
                    return [{
                        processor: new Y.eZ.RichTextEmbedContainer(),
                        priority: 255,
                    }, {
                        processor: new Y.eZ.RichTextResolveImage(),
                        priority: 100,
                    }, {
                        processor: new Y.eZ.RichTextResolveEmbed(),
                        priority: 50,
                    }, {
                        processor: new Y.eZ.RichTextLocationLink(),
                        priority: 10,
                    }];
                },
            },
        }
    });

    Y.eZ.FieldView.registerFieldView('ezrichtext', Y.eZ.RichTextView);
});
