/* @owner publisher | @since RMS-PUB-20261008-01
 * Non-modal SFR layer. Bounds protect the full button strip during move/resize/scroll. */
(function (window) {
    'use strict';
    window.RMSSfrLayer = {
        create: function (options) {
            var T = window.RMSTemplates, V = window.RMSDemoViews, e = T.escape, eventClick = options.onAction;
            var sfrLayer, sfrReturnFocus, sfrGeometry, sfrDrag;
            function closeSfrLayer() {
                if (sfrLayer) {
                    sfrLayer.parentElement.remove();
                    sfrLayer = null;
                }
                sfrDrag = null;
                if (sfrReturnFocus && sfrReturnFocus.isConnected)
                    sfrReturnFocus.focus();
            }
            function sfrLayerBounds() {
                var vw = window.innerWidth || 1024, vh = window.innerHeight || 768, top = 8;
                var disclosure = document.getElementById('rms-demo-disclosure'), bar = document.getElementById('rms-demo-sfr');
                if (disclosure && disclosure.hasAttribute('open') && bar && bar.getBoundingClientRect) {
                    var rect = bar.getBoundingClientRect();
                    if (rect.height > 0 && rect.bottom > 0 && rect.top < vh)
                        top = Math.max(top, rect.bottom + 12);
                }
                return {
                    width: vw, height: vh, top: top, availableHeight: Math.max(0, vh - top - 8)
                };
            }
            function placeSfrLayer(box) {
                var bounds = sfrLayerBounds(), vw = bounds.width, vh = bounds.height;
                box.width = Math.max(Math.min(300, vw - 16), Math.min(box.width, vw - 16));
                box.height = Math.max(Math.min(220, bounds.availableHeight), Math.min(box.height, bounds.availableHeight));
                box.left = Math.max(8, Math.min(box.left, vw - box.width - 8));
                box.top = Math.max(bounds.top, Math.min(box.top, vh - box.height - 8));
                sfrGeometry = box;
                if (sfrLayer)
                    window.RMSLayers.position(sfrLayer, box);
            }
            function repositionSfrLayer() {
                if (sfrLayer)
                    placeSfrLayer(Object.assign({}, sfrGeometry));
            }
            function adjustSfrLayer(box, mode, dx, dy) {
                var next = Object.assign({}, box), vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
                if (mode === 'move') {
                    next.left += dx;
                    next.top += dy;
                }
                else {
                    if (mode !== 'y')
                        next.width = Math.min(next.width + dx, vw - next.left - 8);
                    if (mode !== 'x')
                        next.height = Math.min(next.height + dy, vh - next.top - 8);
                }
                placeSfrLayer(next);
            }
            function openSfrLayer(id) {
                var r = V.requirement(id);
                if (!r)
                    return;
                sfrReturnFocus = document.activeElement;
                if (!sfrLayer) {
                    var wrapper = document.createElement('div');
                    wrapper.className = 'rms-enhance';
                    wrapper.innerHTML = T.render("dialogs/open-sfr-layer", {});
                    document.body.appendChild(wrapper);
                    sfrLayer = wrapper.firstElementChild;
                    sfrLayer.querySelector('[data-sfr-close]').addEventListener('click', closeSfrLayer);
                    sfrLayer.addEventListener('click', eventClick);
                    sfrLayer.addEventListener('pointerdown', function (ev) {
                        var control = ev.target.closest('[data-sfr-move],[data-sfr-resize]');
                        if (!control || ev.button !== 0)
                            return;
                        ev.preventDefault();
                        control.focus();
                        sfrDrag = {
                            pointerId: ev.pointerId, x: ev.clientX, y: ev.clientY, box: Object.assign({}, sfrGeometry), mode: control.hasAttribute('data-sfr-move') ? 'move' : control.dataset.sfrResize
                        };
                        if (control.setPointerCapture)
                            control.setPointerCapture(ev.pointerId);
                    });
                    sfrLayer.addEventListener('keydown', function (ev) {
                        if (ev.key === 'Escape') {
                            ev.preventDefault();
                            closeSfrLayer();
                            return;
                        }
                        var control = ev.target.closest('[data-sfr-move],[data-sfr-resize]'), delta = {
                            ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16]
                        }[ev.key];
                        if (control && delta) {
                            ev.preventDefault();
                            adjustSfrLayer(sfrGeometry, control.hasAttribute('data-sfr-move') ? 'move' : control.dataset.sfrResize, delta[0], delta[1]);
                        }
                    });
                }
                sfrLayer.querySelector('#rms-sfr-layer-title').textContent = r.id + ' · ' + r.name;
                var body = sfrLayer.querySelector('.rms-sfr-layerbody');
                body.innerHTML = T.render("dialogs/open-sfr-layer-2", {
                    definition: r.definition, itemsHtml: r.details.map(function (x) {
                        return T.render("dialogs/open-sfr-layer-3", {
                            x: x
                        });
                    }).join(''), requirementCoverageHtml: V.requirementCoverage(r)
                });
                body.scrollTop = 0;
                var bounds = sfrLayerBounds();
                if (bounds.availableHeight < 220 && bounds.top > 8) {
                    document.getElementById('rms-demo-sfr')?.scrollIntoView?.({
                        block: 'start', behavior: 'instant'
                    });
                    bounds = sfrLayerBounds();
                }
                placeSfrLayer(sfrGeometry || {
                    left: (window.innerWidth || 1024) - 928, top: Math.max(96, bounds.top), width: 900, height: 620
                });
                sfrLayer.querySelector('[data-sfr-move]').focus();
            }
            document.addEventListener('pointermove', function (ev) {
                if (sfrDrag && ev.pointerId === sfrDrag.pointerId)
                    adjustSfrLayer(sfrDrag.box, sfrDrag.mode, ev.clientX - sfrDrag.x, ev.clientY - sfrDrag.y);
            });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (type) {
                document.addEventListener(type, function (ev) {
                    if (sfrDrag && ev.pointerId === sfrDrag.pointerId)
                        sfrDrag = null;
                });
            });
            window.addEventListener('resize', repositionSfrLayer);
            window.addEventListener('scroll', repositionSfrLayer, {
                passive: true
            });
            document.getElementById('rms-demo-disclosure')?.addEventListener('toggle', repositionSfrLayer);
            return {
                open: openSfrLayer, close: closeSfrLayer, reposition: repositionSfrLayer
            };
        }
    };
}(window));
