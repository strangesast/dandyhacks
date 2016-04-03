var wrapperElement = document.getElementById('wrapper');
var transitionInProgress = false;

var hashChangeListenerEvent = function(evt) {
  var hashUrl = window.location.hash.slice(1);
  loadByHash(hashUrl);
};

window.addEventListener('popstate', hashChangeListenerEvent);

// call function after disabling hash listener
var disableHashChangeAndDo = function(func) {
  window.removeEventListener('popstate', hashChangeListenerEvent);
  func();
  window.addEventListener('popstate', hashChangeListenerEvent);
};

var changeHashWithoutEvent = function(hash) {
  return disableHashChangeAndDo(function() {
    return window.location.replace('#' + hash.split('#').join(''));
  });
};

// when doc loads, load correct hash content
document.addEventListener('DOMContentLoaded', function() {
  var hashUrl = window.location.hash.slice(1);
  console.log(hashUrl);
  if(hashUrl === ""){
    changeHashWithoutEvent('#/index');
  }
  loadByHash(hashUrl);
  wrapperElement.classList.remove('loading');
});

// load content at hash url
var loadByHash = function(raw_hashUrl) {
  console.log(raw_hashUrl);
  // clean up trailing / leading '/'s
  var hashUrl = raw_hashUrl.split('/').filter(function(e){return e;}).join('/');
  if(hashUrl === "") {
    hashUrl = 'index';
  } else if (hashUrl === "play") {
    var activePlayerRaw = sessionStorage.getItem('activePlayer');
    if(!activePlayerRaw) {
      changeHashWithoutEvent('#/index');
      hashUrl = 'index';
    } else {
      initGame();
    }
  }
  setActiveTo(hashUrl, true, false);
};

var transition = function(firstElement, secondElement, transformType) {
  transitionInProgress = true;
  var f, s;
  return new Promise(function(resolve, reject) {
    return setTimeout(function() {
      f = firstElement.firstChild.getBoundingClientRect();
      s = secondElement.firstChild.getBoundingClientRect();
      var transform, inverseTransform;
      switch (transformType) {
        case "scale":
          inverseTransform = "scale(" + f.width / s.width + ", " + f.height / s.height + ")";
          transform = "scale(" + s.width / f.width + ", " + s.height / f.height + ")";
          break;
        case "slide":
          transform = "translateX(" + (f.left + f.width) + "px)";
          inverseTransform = "translateX(" + (-s.left - s.width) + "px)";
          break;
        case "sliderev":
          transform = "translateX(" + (-f.left - f.width) + "px)";
          inverseTransform = "translateX(" + (s.left + s.width) + "px)";
          break;

      }
      secondElement.firstChild.style.transform = inverseTransform;
      return setTimeout(function() {
        secondElement.classList.remove('ready');
        secondElement.classList.add('transitioning');
        secondElement.classList.add('active');
      
        firstElement.classList.add('transitioning');
        firstElement.classList.remove('active');

        firstElement.firstChild.style.transform = transform;
        secondElement.firstChild.style.transform = "";

        return setTimeout(function() {
          firstElement.firstChild.style.transform = "";
          firstElement.classList.remove('transitioning');
          secondElement.classList.remove('transitioning');
          transitionInProgress = false;
          return resolve();
        }, 500);
      }, 50);
    }, 50);
  });
};

var getTransitionType = function(rev) {
  //scale, slide
  //var value = transitionTypeElement.value;
  var value = "slide";
  if(rev && value === "slide") {
    return "sliderev";
  }
  return value;
};

var setActiveTo = function(loc, animate, _long) {
  var selector = '[hash-url="' + loc + '"]';
  var div = wrapperElement.querySelector('[hash-url="' + loc + '"]');
  var oldDiv = wrapperElement.querySelector('.active');
  var loadingDiv = wrapperElement.querySelector('[hash-url="loading"]');

  if(div == oldDiv) {
    return;
  }
  if(!oldDiv) {
    div.classList.add('active');
  } else if(animate && _long) {
    transition(oldDiv, loadingDiv, getTransitionType(true)).then(function() {
      setTimeout(function() {
        transition(loadingDiv, div, getTransitionType(true));
      }, 1000);
    });
  } else if(animate) {
    transition(oldDiv, div, getTransitionType(true));
  } else if (div !== oldDiv) {
    oldDiv.classList.remove('active');
    div.classList.add('active');
  }
};

var username_submit_form = document.getElementById('username-submit-form');

username_submit_form.onsubmit = function(e) {
  e.preventDefault();

  var formData = new FormData(username_submit_form);

  general.makeRequest('/account', 'POST', formData, null, null).then(function(request) {
    var parsed = JSON.parse(request.responseText);
    console.log(parsed);
    if('username' in parsed) {
      sessionStorage.setItem('activePlayer', JSON.stringify(parsed));
    } else {
      alert('unexpected result');
    }
    window.location.hash = "/play";
  });

  return false;
};
