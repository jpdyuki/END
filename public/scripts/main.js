SITE_ADDR = { "jisho": "http://jisho.org/search?utf8=✓&keyword=",
              "weblio": "http://www.weblio.jp/content/",
              "hujiang": "https://dict.hjenglish.com/jp/jc/",
              "goojisho": "https://dictionary.goo.ne.jp/freewordsearcher.html?mode=1&kind=jn&MT=",
              "weblio-ruigo": "http://thesaurus.weblio.jp/content/"
            };

SITE_USED_INIT = { "jisho": true,
                   "weblio": true,
                   "hujiang": true,
                   "goojisho": true,
                   "weblio-ruigo": true
                 };

TAB_ORDER_INIT = { "jisho": 0,
                   "weblio": 1,
                   "hujiang": 2,
                   "goojisho": 3,
                   "weblio-ruigo": 4
                 };

CURRENT_PAGE_INIT = "weblio";

_word = null;
_loader_on = false;
_current_page = "";
_current_status = {};
_site_used = {};
_tab_order = {};

function isString(obj){
    return (Object.prototype.toString.call(obj) === '[object String]');
}

function showLoader(){
    _loader_on = true;
    $("#loader").addClass("active");
}

function hideLoader(){
    $("#loader").removeClass("active");
    _loader_on = false;
}

function showPanel(panel){
    $("#container-"+panel).addClass("active");
    selectInput();
}

function hidePanel(panel){
    $("#container-"+panel).removeClass("active");
}

function destroyFrame(frame){
    $("#"+frame).remove();
}

function createFrame(frame, word){
    $("<iframe></iframe>", {
        id: frame,
        src: SITE_ADDR[frame] + word,
        sandbox: "allow-same-origin allow-forms",
        on:{ load: onLoadHandler(frame) }
    }).appendTo("#container-"+frame);
}

function onLoadHandler(panel){
    if(!isString(panel))
        return null;
    return function(){
        _current_status[panel] = 1;
        if(_loader_on && _current_page == panel){
            hideLoader();
            showPanel(panel);
        }
    };
}

function switchToPanel(){
    if(!$("#container-"+_current_page).hasClass("active")){
        // switch tab
        $('[class^="tab"]').removeClass("active");
        $(".tab-"+_current_page).addClass("active");
        // switch panel
        $('.npanel').removeClass("active");
        // determine whether to display loading page
        if(_current_status[_current_page]){
            hideLoader();
            showPanel(_current_page);
        }else{
            showLoader();
        }
    }
    // current page should not be banned
    $('input[id^="ckr-"]').prop('disabled', false);
    $("#ckr-"+_current_page).prop('disabled', true);
}

function switchPanelHandler(panel){
    if(!isString(panel))
        return null;
    return function(){
        _current_page = panel;
        switchToPanel();
        Cookies.set('_current_page', _current_page, { expires: 3650, path: '' });
    };
}

function enableTabs(){
    for(var site in _site_used){
        var val = _site_used[site];
        $('#ckr-'+site).prop("checked", val);
        if(val)
            $(".tab-"+site).removeClass("hidden");
        else
            $(".tab-"+site).addClass("hidden");
    }
}

function togglePanelHandler(){
    var panel = $(this).attr("data-toggle");
    if(this.checked){
        _site_used[panel] = true;
        $(".tab-"+panel).removeClass("hidden");
        if(!(_word === ""))
            searchOn(panel, _word);
    } else {
        if(panel === _current_page){
            this.checked = true;
        } else {
            _site_used[panel] = false;
            hidePanel(panel);
            $(".tab-"+panel).addClass("hidden");
            destroyFrame(panel);
        }
    }
    Cookies.set('_site_used', _site_used, { expires: 3650, path: '' });
}

function repositionTabs(){
    var keys = Object.keys(_tab_order).sort(function(a, b){
        return _tab_order[a] - _tab_order[b];
    });
    var tar_prefixes = ['.tab.tab-', '.tab2.tab-', '.ckr-'];
    var tar_sets = ['.tab', '.tab2', '.checker'];
    for(var t=0; t<tar_prefixes.length; ++t){
        for(var i=0, prevNode; i<keys.length; ++i){
            var tab_attr = keys[i];
            var tar_tab = $(tar_prefixes[t]+tab_attr);
            if(i)
                tar_tab.insertAfter(prevNode);
            else
                tar_tab.insertBefore($(tar_sets[t]).first());
            prevNode = tar_tab;
        }
    }
}

function syncTabOrderHandler(src_qs){
    return function(el){
        _tab_order = TAB_ORDER_INIT;
        var src = $(src_qs);
        for(var i=0; i<src.length; ++i){
            var tab_attr = src[i].getAttribute("data-toggle");
            if(tab_attr in _tab_order)
                _tab_order[tab_attr] = i;
        }
        repositionTabs();
        Cookies.set('_tab_order', _tab_order, { expires: 3650, path: '' });
    }
}

function searchOn(site, word){
    if(!isString(site) || !isString(word))
        return;
    if(!(site in SITE_ADDR))
        return;
    _current_status[site] = 0;
    hidePanel(site);
    destroyFrame(site);
    createFrame(site, word);
    setTimeout(onLoadHandler(site), 5000);
}

function selectInput(){
    $("#search-input")[0].select();
}

function _searchAll(word){
    for(var site in SITE_ADDR){
        if(_site_used[site])
            searchOn(site, word);
    }
    showLoader();
}

function searchAll(word){
    if(word == "" || word == _word)
        return;
    _word = word;
    if(!$("#container-main").hasClass("active")){
        $("#search-bar").addClass("pinned");
        $("#page-switcher, #container-main").removeClass("hidden");
        setTimeout(function(){
            $("#page-switcher").addClass("active");
        }, 400);
        setTimeout(function(){
            $("#container-main").addClass("active");
        }, 550);
        setTimeout(function(){
            _searchAll(word);
        }, 700);
    }
    else _searchAll(word);
}

function checkInput(push){
    var input = $("#search-input");
    var word = input.val();
    if(word == ""){
        input.attr("placeholder", "Keyword should not be empty.");
        return;
    }
    if(!(push === false)){
        history.pushState({}, document.title, "?q="+word);
    }
    searchAll(word);
}

function saveConfig(){
    Cookies.set('_site_used', _site_used, { expires: 3650, path: '' });
    Cookies.set('_tab_order', _tab_order, { expires: 3650, path: '' });
}

function validateConfig(){
    var valid = !((_site_used === undefined) || (_tab_order === undefined));
    if(valid){
        for(var site in SITE_ADDR){
            valid &= (site in _site_used) && (site in _tab_order);
        }
        for(var key in _site_used){
            var val = _site_used[key];
            valid &= ((val === true) || (val === false));
        }
        for(var key in _tab_order){
            var val = _tab_order[key];
            valid &= Number.isInteger(val);
        }
    }
    if(!valid){
        _site_used = SITE_USED_INIT;
        _tab_order = TAB_ORDER_INIT;
    }
    if(!(_current_page in SITE_ADDR))
        _current_page = CURRENT_PAGE_INIT;
}

function loadConfig(){
    _site_used = Cookies.getJSON('_site_used');
    _tab_order = Cookies.getJSON('_tab_order');
    _current_page = Cookies.get('_current_page');
    validateConfig();
    enableTabs();
    repositionTabs();
}

function parseQuery(){
    var search = window.location.search;
    var ret = false;
    if(search.startsWith("?q=")){
        var param = search.slice(3).split("&", 1);
        if(param.length){
            $("#search-input").val(decodeURIComponent(param));
            checkInput(false);
            ret = true;
        }
    }
    return ret;
}

$(function(){
    $(window).on("keydown", function(e){
        if(e.keyCode == 13)
            checkInput();
    });

    // reload pages when user click browser's BACK or FORWARD button 
    $(window).on("popstate", function() {
        _word = "";
        if(!parseQuery())
            location.reload(true);
    });

    // click events
    $("#search-btn").click(checkInput);
    $("#search-input").click(function(){
        $(this).attr("placeholder", 'Search a Japanese word. Eg."走る"');
    });
    for(var site in SITE_ADDR){
        $(".tab-"+site).click(switchPanelHandler(site));
    }
    $('input[id^="ckr-"]').on('change', togglePanelHandler);

    // drag events
    dragula([document.querySelector('#page-switcher')], {
        direction: "horizontal",
        revertOnSpill: true,
        mirrorContainer: document.querySelector('#cp-drag'),
        accepts: function(el, target, source, sibling){
            return !(sibling === null);
        },
        invalid: function (el, handle) {
            return el.id === "config";
        }
    }).on("dragend", syncTabOrderHandler('.tab'));
    dragula([document.querySelector('#page-switcher-side')], {
        direction: "vertical",
        revertOnSpill: true,
        mirrorContainer: document.querySelector('#cp-drag')
    }).on("dragend", syncTabOrderHandler('.tab2'));
    
    loadConfig();
    parseQuery();
});
