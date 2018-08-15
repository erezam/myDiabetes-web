var storageAPI = function() {
    var catalog;
    
    var init = function() {
        if(window.localStorage) {
            catalog = {};
            for(var i = 0; i < localStorage.length; i++)
                catalog[localStorage.key(i)] = true;
            console.log("Storage initiallized");
        }
        else {
            console.log("No Storage API available");
        }
    };
    
    var createObject = function(type) {
        if(!localStorage.getItem(type))
            localStorage.setItem(type, JSON.stringify({}));
        catalog[type] = true;
    };
    
    var save = function(type, obj) {
        if(!catalog[type])
            console.log("No such object " + type);
        else {
            var dataString = localStorage.getItem(type);
            var dataObject = JSON.parse(dataString);
            dataObject[obj.id] = obj;
            localStorage.setItem(type, JSON.stringify(dataObject));
        }
    };
    
    var getAll = function(type) {
        if(!catalog[type])
            console.log("No such object " + type);
        else {
            var res = [];
            var dataString = localStorage.getItem(type);
            var dataObject = JSON.parse(dataString);
            for(var prop in dataObject)
                res.push(dataObject[prop]);
            return res;
        }
    };
    
    var drop = function(type) {
        if(!catalog[type])
            console.log("No such object " + type);
        else 
            localStorage.removeItem(type);
    };
    
    return {
        init : init,
        createObject : createObject,
        save : save,
        getAll : getAll,
        drop : drop
    };
    
}();