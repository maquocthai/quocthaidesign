var config = {
    lightbox: {
        fileLoadingImage: 'http://warren.mesozen.com//wp-content/themes/winston/images/loading.gif',
        fileBottomNavCloseImage: 'http://warren.mesozen.com//wp-content/themes/winston/images/closelabel.gif'
    },
    photo_extras: 'date_taken, owner_name, icon_server, tags, views',
    api_key: '4145fe917d61d1c4d2716a08db89d6f1'
}

var cache = {};
var flickr = new Flickr({api_key: config.api_key});
var delegates = { jparallax: { toggleSuspend: function () {
} }, flickrbox: { show: function () {
} }};

$.fn.plx_tobottom = function (target) {
    var toff = $(target).offset();
    var th = $(target).height();
    var tw = $(target).width();
    $(this).css({
        position: 'absolute',
        left: toff.left,
        top: toff.top + th,
        width: tw
    });

    return $(this);
};

function load_user_photostream(username, user_id) {
    resetThumbnails('#interesting');
    flickr.people_getPublicPhotos({per_page: 125, user_id: user_id, extras: config.photo_extras}, renderImages);
}

function load_user_favorites(username, user_id) {
    resetThumbnails('#interesting');
    flickr.favorites_getPublicList({per_page: 125, user_id: user_id, extras: config.photo_extras}, renderImages);
}

function open_photo_page(user_id, photo_id) {
    window.open(flickrPhotoPage(user_id, photo_id));
}

function setupLightbox(selector) {
    $(selector)
        .click(function () {
            var target = $(this);
            var photo = cache[$(this).attr('id')];
            $('#plx-photoinfo').trigger('update', [photo.title, photo.id, photo.datetaken, photo.tags, photo.views, photo.ownername, photo.owner, buddyicon(photo)]).show();
            $('#lightbox').trigger('display', [photoUrl(photo)]);
            return false;
        });

}

function track(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    $($('.cnt').get().reverse()).each(function (i, cnt) {
        $(this).find('.img').each(function (i, item) {
            var offset = $(item).offset();
            if (x >= offset.left && x <= (offset.left + $(item).width()) &&
                y >= offset.top && y <= (offset.top + $(item).height())) {
                $(item).click();
                return false;
            }

        });
    })
    return false;
};

function cycle() {
    var l0 = $('#l0').children().remove();
    var l1 = $('#l1').children().remove();
    $('#l1').append(l0);
    var l2 = $('#l2').children().remove();
    $('#l2').append(l1);
    var l3 = $('#l3').children().remove();
    $('#l3').append(l2);
    var l4 = $('#l4').children().remove();
    $('#l4').append(l3);
    $('#l0').append(l4);
    setupLightbox('.img');
    return false;
}

function setupHotkeys() {
    $(document).keypress(function (e) {
        switch (e.which) {
            case 32:
                delegates.jparallax.toggleSuspend();
                return false;
            case 99:
            case 67:
                cycle();
                return false;
        }
        return true;
    });
}

function initJparallax(container) {
    for (var idx = 0; idx < 125; idx++) {
        var div = '#l' + (4 - (Math.floor(idx / 25))) + ' div';
        var span = $('<a class="img" rel="lightbox[ploreex]"><img width="76px" height="76px" style="width:76px; height:76px;"/></a>')
            .attr('id', 'photo-container-' + idx)
            .appendTo($(div));
        if ($(div).find('.img').length > 1 && ($(div).find('.img').length % 5) == 1) span.css('clear', 'both');
    }

    var step = 100;
    var base = (76 + (60 * 2) + (7 * 2) + (1 * 2)) * 6;
    var middle = 0;

    $(container).find('div.cnt').each(function (i, el) {
        $(el).css({width: base, height: base});
        if (i == 2) middle = base;
        base += step;
    });

    $(container).css({
        width: middle,
        height: middle,
        left: ($(window).width() - 780) / 2,
        top: ($(window).height() - 780) / 2
    }).jparallax({
            layersettings: [
                {xtravel: 3, ytravel: 3},
                {xtravel: 3, ytravel: 3},
                {xtravel: 3, ytravel: 3},
                {xtravel: 3, ytravel: 3},
                {xtravel: 3, ytravel: 3}
            ]
        }, delegates.jparallax).click(track);

}

function renderImages(response) {
    cache = {};
    $("img").unbind('click');
    $.each(response.photos.photo, function (idx, photo) {
        var id = 'photo-container-' + idx;
        cache[id] = photo;
        $('#' + id).attr('href', photoUrl(photo))
            .find('img')
            .attr('src', photoUrl(photo, 't'))
            .load(function () {
                $(this).css('backgroundColor', 'white').parent().css('backgroundColor', 'black');
                return false;
            });
    });
    setupLightbox('.img');
}

function resetThumbnails(container) {
    $(container).find("img").load(function () {
        $(this).css('backgroundColor', '').parent().css('backgroundColor', '');
        return false;
    }).attr('src', 'http://www.tomntrix.demon.co.uk/designpharm/images/gif/transparent.gif').css('backgroundColor', 'transparent')
}

$(function () {
    $(window).error(function (msg, url, line) {
        $.get('error.html', {msg: msg, url: url, line: line});
    });
    initJparallax('#interesting');
    resetThumbnails('#interesting');
    flickr.interestingness_getList({per_page: 125, extras: config.photo_extras}, renderImages);
    setupHotkeys();
    $('#plx-menu-user').plx_usermenu();
    $('#plx-photoinfo').plx_photoinfo();
    $('#lightbox').lightbox();
});

$.fn.plx_usermenu = function () {
    var ctx = {
        username: '',
        user_id: ''
    }
    var user_menu = $(this);
    return $(this)
        .hide()
        .bind('update', function (ev, username, user_id, buddyiconSrc) {
            ctx.username = username;
            ctx.user_id = user_id;
            $(this)
                .find('.plx-menu-user-actions').hide().end()
                .find('.plx-menu-user-username').html(username).end()
                .find('.plx-menu-user-buddyicon').attr('src', buddyiconSrc);
        })
        .bind('show-photostream', function () {
            $(this)
                .find('.plx-menu-user-actions li').show().end()
                .find('.plx-menu-user-actions').hide().end()
                .find('.plx-menu-user-showing').html('photostream').end()
                .find('.plx-menu-user-action-photostream').hide().end()
                .show();
            $('#plx-menu-flickr').hide();
            $('#plx-photoinfo').trigger('set-mode-user').hide();
            load_user_photostream(ctx.username, ctx.user_id);
        })
        .bind('show-favorites', function () {
            $(this)
                .find('.plx-menu-user-actions li').show().end()
                .find('.plx-menu-user-actions').hide().end()
                .find('.plx-menu-user-showing').html('favorites').end()
                .find('.plx-menu-user-action-favorites').hide().end()
                .show();
            $('#plx-menu-flickr').hide();
            $('#plx-photoinfo').trigger('set-mode-mixed').hide();
            load_user_favorites(ctx.username, ctx.user_id);
        })
        .find('.plx-menu-user-showing').click(function () {
            $(user_menu).find('.plx-menu-user-actions').plx_tobottom($(this)).toggle();
        }).end()
        .find('.plx-menu-user-action-photostream').click(function () {
            $(user_menu).trigger('show-photostream');
        }).end()
        .find('.plx-menu-user-action-favorites').click(function () {
            $(user_menu).trigger('show-favorites');
        }).end()
        .find('.plx-menu-user-actions').hide()
        .end();
}

$.fn.plx_photoinfo = function () {
    var ctx = {
        username: '', user_id: '', buddyiconSrc: '', photo_id: ''
    };
    var photo_info = $(this);
    return $(this)
        .hide()
        .bind('update', function (ev, title, photo_id, datetaken, tags, views, username, user_id, buddyiconSrc) {
            ctx.photo_id = photo_id;
            ctx.username = username;
            ctx.user_id = user_id;
            ctx.buddyiconSrc = buddyiconSrc;
            $(this)
                .find('.plx-photoinfo-title').html(title).end()
                .find('.plx-photoinfo-datetaken').html(datetaken).end()
                .find('.plx-photoinfo-tags').html(tags).end()
                .find('.plx-photoinfo-views').html(views).end()
                .find('.plx-photoinfo-user-buddyicon').attr('src', buddyiconSrc).end()
                .find('.plx-photoinfo-user-name').html(username);
        })
        .bind('set-mode-mixed', function () {
            $(this).find('.plx-photoinfo-user-details, .plx-photoinfo-actions').show();
        })
        .bind('set-mode-user', function () {
            $(this).find('.plx-photoinfo-user-details, .plx-photoinfo-actions').hide();
        })
        .find('.plx-photoinfo-action-photostream').click(function () {
            $('#plx-menu-user').trigger('update', [ctx.username, ctx.user_id, ctx.buddyiconSrc]).trigger('show-photostream');
            $(photo_info).hide();
        }).end()
        .find('.plx-photoinfo-action-favorites').click(function () {
            $('#plx-menu-user').trigger('update', [ctx.username, ctx.user_id, ctx.buddyiconSrc]).trigger('show-favorites');
            $(photo_info).hide();
        }).end()
        .find('.plx-photoinfo-action-open-photo-page').click(function () {
            open_photo_page(ctx.user_id, ctx.photo_id);
        });
}