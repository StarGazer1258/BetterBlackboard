// ==UserScript==
// @author      Nathaniel Johns
// @name        BetterBlackboard
// @version     0.1.0
// @description Fix some annoyances about FHSU's new Blackboard.
// @include     https://blackboard.*.edu/ultra/*
// @include     https://bb.*.edu/ultra/*
// @grant       GM_addStyle
// @run-at document-end
// ==/UserScript==


// GM_addStyle shim by Brock Adams on StackOverflow (https://stackoverflow.com/a/19392142)
function GM_addStyle (cssStr) {
  var D               = document;
  var newNode         = D.createElement ('style');
  newNode.textContent = cssStr;

  var targ    = D.getElementsByTagName ('head')[0] || D.body || D.documentElement;
  targ.appendChild (newNode);
}

function insertAfter(parent, child) {
	var p = document.querySelector(parent)
  if(p) {
   	p.insertBefore(child)
  }
}


let userId
let termIds = []

let findUserId = setInterval(() => {
  let bbUsername = document.querySelector('bb-username#sidebar-user-name')
  if(bbUsername) {
    userId = bbUsername.className.split('course_user')[1]
    console.log("Found userId: " + userId)
    clearInterval(findUserId)
  } else {
    console.log("Looking for userId")
  }
}, 500)


// Course links loop
let courseLinkLoop = setInterval(() => {
  if(userId === null) return
  fetch('https://blackboard.fhsu.edu/learn/api/v1/users/' + userId + '/memberships?expand=course.effectiveAvailability').then((res) => res.json()).then((json) => {
    for(let i = 0; i < json.results.length; i++) {
      if(json.results[i].course.term != null && !termIds.includes(json.results[i].course.term.id)) termIds.push(json.results[i].course.term.id)
      
      let moreInfo = document.querySelector('#more-info-' + json.results[i].course.id)
      let bbbNewTabLink = document.querySelector('#bbb-new-tab-link-' + json.results[i].course.id)
      
      if(moreInfo && !bbbNewTabLink) {
        let newTabLink = document.createElement('div')
        newTabLink.id = 'bbb-new-tab-link-' + json.results[i].course.id
        newTabLink.innerText = 'Open in New Tab'
        newTabLink.className = 'bbb-new-tab-link'
        newTabLink.setAttribute('onclick', 'event.preventDefault(); event.stopPropagation(); window.open("https://blackboard.fhsu.edu' + json.results[i].course.homePageUrl +  '", "_blank"); return false;')
        
        moreInfo.parentNode.after(newTabLink)
      }
    }
    
    for(let t = 0; t < termIds.length; t++) {
      let termLabel = document.querySelector('#course-card-term-name-' + termIds[t])
      let bbbTabulateLink = document.querySelector('#bbb-tabulate-link-' + termIds[t])

      if(termLabel && !bbbTabulateLink) {
        let termCourses = []
        
        for(let c = 0; c < json.results.length; c++) {
          if(json.results[c].course.term != null && json.results[c].course.term.id === termIds[t]) {
            termCourses.push(json.results[c].course.homePageUrl)
          }
        }
        
        let onClick = ''

        for(let tc = 0; tc < termCourses.length; tc++) {
          onClick += 'window.open("https://blackboard.fhsu.edu' + termCourses[tc] + '", "_blank");'
        }

        onClick += "return false;"

        let tabulateLink = document.createElement('div')
        tabulateLink.id = 'bbb-tabulate-link-' + termIds[t]
        tabulateLink.innerText = ' | Tabulate Courses'
        tabulateLink.className = 'bbb-tabulate-link'
        tabulateLink.setAttribute('onclick', onClick)

        termLabel.after(tabulateLink)
      }
    }
  })
}, 500)

GM_addStyle(`
	.bbb-new-tab-link:hover {
		color: black;
	}

	.bbb-tabulate-link {
		display: inline;
		cursor: pointer;
	}

	.course-card-term-name {
		display:  inline-block !important;
	}
`)