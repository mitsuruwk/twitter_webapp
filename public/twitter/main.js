require(["twitter_api"], function(TwitterAPI) {
    $(document).ready(function() {
        var screen = $("#screen"),
            search_template = _.template($("#search-template").text()),
            tweet_template = _.template($("#tweet-template").text()),
            tweet_image_template = _.template($("#tweet-image-template").text()),
            users_template = _.template($("#users-template").text()),
            load_image = function (src, callback) {
                var req = new XMLHttpRequest(),
                old_data_scheme = localStorage[src],
                data_scheme;

                if (null != old_data_scheme) {
                    callback(old_data_scheme);
                }

                req.open('GET', "proxy?url=" + src, true);
                req.overrideMimeType('text/plain; charset=x-user-defined');
                req.onload = function() {
                    var resText=req.responseText.replace(
                        /[\u0100-\uffff]/g,
                        function(c){
                            return String.fromCharCode(c.charCodeAt(0)&0xff);
                        }
                    ),
                    data_scheme = "data:" +
                                  req.getResponseHeader("Content-Type") +
                                  ";base64," + btoa(resText);

                    if (old_data_scheme !== data_scheme) {
                        localStorage[src] = data_scheme;
                        callback(data_scheme);              
                    }
                };

                req.send();
            },
            update_link_icon = function (src, title) {
                load_image(src, function (src) {
                    $($.grep($("link"), function (n) {
                        var rel = $(n).attr("rel");
                        return (rel === "apple-touch-icon-precomposed") ||
                            (rel === "shortcut icon");      
                    })).attr("href", src);

                    $("#profile-image-style").remove();
                    $("head").append(tweet_image_template({src:src}));
                });
                $("title").text(title);
            },
            render = function (json, template) {
                screen.empty();
                screen.html(template({json: json}));
            },            
            show_me_and_friends = function (screen_name) {
                var data = {
                    screen_name: screen_name,
                    include_entities: true
                };

                TwitterAPI.users_lookup_friends_ids(data, function (json) {
                    json.unshift(json.pop());
                    render(json, users_template);
                    json.push(json.shift());
                });
            },            
            show_list_members = function (owner_screen_name, slug) {
                var data = {
                    owner_screen_name: owner_screen_name,
                    slug: slug
                };

                TwitterAPI.lists_members(data, function (json) {
                    render(json.users, users_template);

                    if (json.users[0]) {
                        user = json.users[0];
                        update_link_icon(user.profile_image_url, slug);
                    }
                });
            },
            _show_user_timeline = function (json) {
                var user;

                render(json, tweet_template);
                if (json[0]) {
                    user = json[0].user;
                    update_link_icon(user.profile_image_url,
                                     user.name);
                }
            },
            show_user_timeline = function (screen_name) {
                var data = {
                    screen_name: screen_name
                    // count: 200
                },
                cache = localStorage[screen_name];
                    
                if (cache) {
                    _show_user_timeline(JSON.parse(cache));
                }

                TwitterAPI.user_timeline(data, function (json) {
                    json.show_link = show_link;
                    _show_user_timeline(json);
                    localStorage[screen_name] = JSON.stringify(json);                         
                });
            },
            show_search_input = function () {
                render(null, search_template);
            },
            show_search_profile = function (q) {
                var data = {
                    q: q,
                    count: 100
                };

                TwitterAPI.search_in_profile(data, function (json) {
                    render(json.users, users_template);
                });                  
            },
            update_screen = function () {
                var val, paths;

                if (hash != window.location.hash) {
                    hash = window.location.hash;
                
                    if (hash === '') {
                        show_search_input();
                        show_link = true;
                    } else {
                        val = hash.substr(1);
                        location_history.push(val); // for iOS web app

                        paths = val.trim().split("/");

                        // < routing >
                        // search/#{keyword}
                        // #{screenname}/me_and_follower
                        // #{screenname}/#{slug}
                        // #{screenname}

                        if (paths[0] == "search") {
                            show_search_profile(paths[1]);
                        } else if (paths[1] === "me_and_follower") {
                            show_me_and_friends(paths[0]);
                        } else if (paths[1]) {
                            show_list_members(paths[0], paths[1]);
                        } else {
                            show_user_timeline(paths[0]);
                        }
                    }
                }
            },
            hash,
            location_history = [], // for iOS web app
            show_link = false;

        update_screen();

        setInterval(function () {
            update_screen();
        }, 200);

        $("input").live('keyup', function (e) {
            if (e.keyCode === 13) {
                var val = $('input').val();

                if (val.indexOf("/") !== -1) {
                    window.location.hash = val; 
                } else {
                    window.location.hash = "search/" + encodeURI(val); 
                }
            }
        });

        $(".profile-image").live('click', function (e) {
            var parent = $(this).parent(),
                class_name = parent.attr("class"),
                screen_name = $(".screen-name", parent).text().trim();
            
            if (class_name == "user") {
                window.location.hash = screen_name;
            } else if (class_name == "tweet") {
                window.location.hash = screen_name + "/me_and_follower";
            }
            $("body").scrollTop(0);
        });

        $(".users, .tweets").live('gesturestart', function (e) {
            window.location.hash = location_history.pop();
            $("body").scrollTop(0);
        });
    });
});
