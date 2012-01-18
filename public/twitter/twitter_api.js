define("twitter_api", function () {
    $.ajaxSetup({
        dataType: "json",
        cache: true
    });

    return {
       users_lookup : function (data, callback) {
           var url = "https://api.twitter.com/1/users/lookup.json";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       },
       rate_limit : function (callback) {
           var url = "https://api.twitter.com/1/account/rate_limit_status.json";

           $.ajax({
               url: url,
               success: callback
           });
       },
       friends_ids : function (data, callback) {
           var url = "https://api.twitter.com/1/friends/ids.json";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       }, 
       user_timeline : function (data, callback) {
           var url = "https://api.twitter.com/1/statuses/user_timeline.json";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       },
       lists : function (data, callback) {
           var url = "https://api.twitter.com/1/lists.json";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       },
       lists_members : function (data, callback) {
           var url = "https://api.twitter.com/1/lists/members.json";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       },
       search_in_profile : function (data, callback) {
           var url = "http://api.twpro.jp/1/search";

           this._ajax_with_cache({
               url: url,
               data: data,
               success: callback
           });
       },
       users_lookup_friends_ids : function (data, callback) {
           var that = this;

           this.friends_ids(data, function (json) {
               var clone_data = _.clone(data),
                   count = 99;

               if (json.ids.length > count) {
                  json.ids = json.ids.slice(0, count);
               }

               clone_data.user_id = json.ids.join(',');
               that.users_lookup(clone_data, callback);
           });
       },
       _create_key : function (params) {
           var name, query = "";
           
           if (params.data) {
               query = "?";

               for (name in params.data) {
                   query += name + "=" + params.data[name];
               }               
           }

           return params.url + query;
       },
       _ajax_with_cache : function (params) {
           var that = this,
               key = this._create_key(params),
               callback = params.success;

           this._cache = this._cache || {};

           console.log(key, this._cache[key] != undefined);

           if (this._cache[key] != undefined) {
               callback(this._cache[key]);
           } else {
               params.success = function (json) {
                   that._cache[key] = json;
                   callback(json);
               };

               params.data.url = params.url;
               params.url = "proxy"; 
               $.ajax(params);               
           }
       }
    };
});
