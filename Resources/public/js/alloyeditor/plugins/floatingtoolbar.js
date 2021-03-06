/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
/* global CKEDITOR */
YUI.add('ez-alloyeditor-plugin-floatingtoolbar', function (Y) {
    'use strict';

    if (CKEDITOR.plugins.get('ezfloatingtoolbar')) {
        return;
    }

    var FLOATING_TOOLBAR_SELECTOR = '.ae-toolbar-floating',
        FLOATING_TOOLBAR_FIXED_CLASS = 'ae-toolbar-floating-fixed',
        SCROLL_HANDLER_DEBOUNCE_TIMEOUT = 100,
        scrollHandler;

    function findScrollParent(editor) {
        var container = editor.closest('.ez-main-content');

        if (window.getComputedStyle(container).getPropertyValue('overflow') === 'auto') {
            return container;
        }

        return window;
    }

    function findFocusedEditor() {
        for (var name in CKEDITOR.instances) {
            if (CKEDITOR.instances[name].focusManager.hasFocus) {
                return CKEDITOR.instances[name];
            }
        }

        return null;
    }

    function updateToolbarPosition() {
        var toolbar = document.querySelector(FLOATING_TOOLBAR_SELECTOR),
            editor = findFocusedEditor(),
            editorRect,
            top;

        if (!toolbar || !editor) {
            return;
        }

        editorRect = editor.element.getClientRect();
        top = editorRect.top < 0 ? 0 : editorRect.top + editor.element.getWindow().getScrollPosition().y - toolbar.getBoundingClientRect().height;
        toolbar.style.top = top + 'px';
        toolbar.classList.toggle(FLOATING_TOOLBAR_FIXED_CLASS, editorRect.top < 0);
    }

    scrollHandler = CKEDITOR.tools.debounce(updateToolbarPosition, SCROLL_HANDLER_DEBOUNCE_TIMEOUT);

    /**
     * CKEditor plugin to handle pin/unpin the floating toolbars on scrolling in viewport.
     *
     * @class ezfloatingtoolbar
     * @namespace CKEDITOR.plugins
     * @constructor
     */
    CKEDITOR.plugins.add('ezfloatingtoolbar', {
        init: function (editor) {
            findScrollParent(editor.element.$).addEventListener('scroll', scrollHandler);
        },
    });
});

