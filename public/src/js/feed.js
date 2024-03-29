var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player')
var canvasElement = document.querySelector('#canvas')
var captureButton = document.querySelector('#capture-btn')
var imagePicker = document.querySelector('#image-picker')
var imagePickerArea = document.querySelector('#pick-image')
var picture;
var locationBtn = document.querySelector('#location-btn')
var locationLoader = document.querySelector('#location-loader')
var fetchedLocation = { lat: 0, lng: 0 };

function getMyLocation(lat, lng) {
  fetch("https://us1.locationiq.com/v1/reverse.php?key=pk.c1b2fe03c3ba2a9395955609318b6829&lat=" + lat.toString() + "&lon=" + lng.toString() + "&format=json")
    .then((res) => {
      return res.json()
    })
    .then((data) => {
      console.log(data.address);
      locationInput.value = data.address.state + ', ' + data.address.country
    })
}

locationBtn.addEventListener('click', (event) => {
  if (!('geolocation' in navigator)) {
    return
  }
  var sawAlert = false

  locationBtn.style.display = 'none'
  locationLoader.style.display = 'block'

  navigator.geolocation.getCurrentPosition((position) => {
    locationBtn.style.display = 'inline'
    locationLoader.style.display = 'none'
    console.log(position);
    fetchedLocation = { lat: position.coords.latitude, lng: position.coords.latitude }
    console.log(position.coords.latitude, position.coords.longitude);
    getMyLocation(position.coords.latitude, position.coords.longitude);
    document.querySelector('#manual-location').classList.add('is-focused');
  }, (err) => {
    console.log(err);
    locationBtn.style.display = 'inline'
    locationLoader.style.display = 'none'
    if (!sawAlert) {
      alert('Could not fetch location, please enter manually!')
      sawAlert = true
    }
    fetchedLocation = { lat: 0, lng: 0 }
  }, { timeout: 7000 })

})

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none'
  }
}

function initializeMedia() {
  if (!'mediaDevices' in navigator) {
    navigator.mediaDevices = {}
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = (constraints) => {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'))
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })

    }
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch((err) => {
      imagePickerArea.style.display = 'block';
    })
}

captureButton.addEventListener('click', (event) => {
  canvasElement.style.display = 'block'
  videoPlayer.style.display = 'none'
  captureButton.style.display = 'none'

  var context = canvasElement.getContext('2d')
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width))
  videoPlayer.srcObject.getVideoTracks().forEach((track) => {
    track.stop();
  })
  picture = dataURItoBlob(canvasElement.toDataURL());

})

imagePicker.addEventListener('change', (event) => {
  picture = event.target.files[0];
})

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1)
  initializeMedia();
  initializeLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    })
  }
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1)
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function (cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '512px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  // componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

var url = _apiBaseUrl + '/posts/';
var networkDataReceived = false;

function updateUI(data) {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i])
  }
}
fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = []
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray)
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then((data) => {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data)
      }
    })
}

function sendData() {
  var postData = new FormData();
  var id = new Date().toISOString()
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, id + '.png');

  fetch(_apiBaseUrl + '/posts/', {
    method: 'POST',
    body: postData
  })
    .then((res) => {
      console.log('Sent Data', res);
      updateUI();
    })
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((sw) => {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          rawLocation: fetchedLocation
        }
        writeData('sync-posts', post)
          .then(() => {
            return sw.sync.register('sync-new-post');
          })
          .then(() => {
            var snackBarContainer = document.querySelector('#confirmation-toast');
            var data = { message: 'Your Post was saved for syncing!' };
            snackBarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch((err) => {
            console.log(err);
          })
      })
  } else {
    sendData()
  }
})