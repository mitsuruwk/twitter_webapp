require(["twitter_api"], function(TwitterAPI) {
    $(document).ready(function() {
        var screen = $("#screen"),
            search_template = _.template($("#search-template").text()),
            tweet_template = _.template($("#tweet-template").text()),
            users_template = _.template($("#users-template").text()),
            update_link_icon = function (src, title) {
                $($.grep($("link"), function (n) {
                    var rel = $(n).attr("rel");
                    return (rel === "apple-touch-icon-precomposed") ||
                        (rel === "shortcut icon");      
                })).attr("href", src);
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
                    var user;

                    render(json.users, users_template);

                    if (json.users[0]) {
                        user = json.users[0];
                        update_link_icon(user.profile_image_url, slug);
                    }
                });
            },            
            show_user_timeline = function (screen_name) {
                var data = {
                    screen_name: screen_name
                    // count: 200
                };

                TwitterAPI.user_timeline(data, function (json) {
                    var user;

                    render(json, tweet_template);

                    if (json[0]) {
                        user = json[0].user;
                        update_link_icon(user.profile_image_url,
                                         user.name);
                    }
                });
            },
            show_search_input = function () {
                render(null, search_template);
            },
            update_screen = function () {
                var val, a, slug, screen_name;

                if (hash != window.location.hash) {
                    hash = window.location.hash;
                
                    if (hash === '') {
                        show_search_input();
                    } else {
                        val = hash.substr(1);
                        a = val.trim().split("/");
                        screen_name = a[0];
                        slug = a[1];
                        
                        location_history.push(val);

                        if (slug === "me_and_follower") {
                            show_me_and_friends(screen_name);
                        } else if (slug) {
                            show_list_members(screen_name, slug);
                        } else {
                            show_user_timeline(screen_name);
                        }
                    }
                }
            },
            hash,
            location_history = []; // for Web App on iOS

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
                    window.location.hash = val + "/me_and_follower";
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
