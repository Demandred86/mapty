'use strict';

// User Stories.

// As a User
// I want to "log my running workouts with location, distance, time, pace and seteps/minute",
// so I can keep a log of all my running"

// As a user,
// I want to "log my cycling workouts with location, distance, time, speed and elevation gain",
// so I can keep a log of all my cycling

// As a user,
// I want to "see all my workouts at a glance",
// so I can easily track my progress over time"

// As a user,
// I want to "also see my workouts on a map",
// so I can easily check where I work out the most.

// As a user,
// I want to "see all my workouts whern I leave the app and come back later",
// so that I can keep using the app over time

// Features
// 1)   Map where user clicks to add new workout
//      Geolocation to display map at current location
//      Form to input distance, time, pace, elevation gain
// 2)   Form to input distance, time, speed, elevation gain
// 3)   Displauy all workouts in a list
// 4)   Display all workouts on the map
// 5)   store the workout data in browser usiing local storate API
// 6)   On page load, read the saved data from local storage and display

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // taking the last 10 digits form the date
  click = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevation = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new cycling([39, -12], 27, 95, 523);

///////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
///////////////////////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const edit_allPar = document.querySelector('.edit-all');
const allButtons = document.querySelectorAll('button');

const editButton = document.querySelector('.button__edit');
const saveButton = document.querySelector('.button__save');
const backButton = document.querySelector('.button__back');

class App {
  // Private instance Properties;
  #map;
  #mapEvent;
  #mapZoomLevel = 16;
  #workouts = [];
  #selectedWorkout;
  #editOn = 0;
  workout;
  id;
  lat;
  lng;
  coords = [];
  constructor() {
    // Get user position
    this._getPosition();

    // get local storage
    this._getLocalStorage();

    //Attacch event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    editButton.addEventListener('click', this._editFunction.bind(this));
    saveButton.addEventListener('click', this._saveFunction.bind(this));
    backButton.addEventListener('click', this._backFunction.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get current position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    // Handling clicks on map
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  _newWorkout(e) {
    ///////////////////////////////////////////////
    //HELPER FUNCTIONS//////////////////////////////
    e.preventDefault();
    ///////////////////////////////////////////////
    // Get data from form
    ///////////////////////////////////////////////
    //If workout running, create running object
    if (this.#editOn === 0) {
      const { lat, lng } = this.#mapEvent.latlng;

      const type = inputType.value;
      const distance = +inputDistance.value; // converts to number
      const duration = +inputDuration.value;
      this._createRunningWorkout(type, distance, duration, lat, lng);
      this._createCyclingWorkout(type, distance, duration, lat, lng);
      this.#workouts.push(this.workout);
      this._renderWorkoutMarker(this.workout);
      this._renderWorkout(this.workout);
      this._hideForm();
      this._setLocalStorage();
    }
  }
  _editWorkout(e) {
    e.preventDefault();
    if (this.#editOn === 1) {
      const type = inputType.value;
      const distance = +inputDistance.value; // converts to number
      const duration = +inputDuration.value;

      this._createRunningWorkout(type, distance, duration, this.lat, this.lng);
      this._createCyclingWorkout(type, distance, duration, this.lat, this.lng);
      this.workout.id = this.id;
      console.log('this.workout.id ', this.workout.id);
      this.workout.coords.lat = this.lat;
      console.log('this.workout.coords.lat', this.workout.coords.lat);
      this.workout.coords.lng = this.lng;
      console.log('this.workout.coords.lng', this.workout.coords.lng);
      // Lik it to real workout
      console.log(this.workout);
      console.log(this.workout.id);
      console.log(this.id);
      this.#workouts[
        this.#workouts.findIndex(workout => workout.id === this.id)
      ] = this.workout;
      const workoutHtml = document.querySelector(
        `[data-id="${this.workout.id}"]`
      );
      console.log('workoutHtml', workoutHtml);
      workoutHtml.replaceWith = '';
      console.log(this.#workouts);
      //    workout.id === this.id)}
      this._renderWorkout(this.workout);
      this._hideForm();
      this._setLocalStorage();
      //clear list
    }
  }

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  ///////////////////////////////////////////////
  // Render workout as list functions
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div> 
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log('moveToPopup workoutEl', workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log('moveToPopup - Workout', workout);
    console.log('moveToPopup - this.#map ', this.#map);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    this._retrieveData(workout);
    //Retrieving data
  }

  _retrieveData(workout) {
    console.log(workout);
    if (this.#editOn === 1) {
      this._showForm();
      inputType.value = workout.type;
      inputDistance.value = workout.distance;
      inputDuration.value = workout.duration;
      this.id = workout.id;
      [this.lat, this.lng] = [...workout.coords];
      console.log(this.lat, this.lng, this.id);
      if (workout.type === 'running') {
        inputCadence.value = workout.cadence;
      }
      if (workout.type === 'cycling') {
        this._toggleElevationField();
        inputElevation.value = workout.elevation;
      }
      console.log('Retrieve Data Function', workout);

      //Editing data
      //      form.addEventListener('submit', this._updateWorkout.bind(this));
    }
  }
  // Using public interface;
  //workout.clicks();

  _editFunction(e) {
    e.preventDefault();
    if (e.target !== editButton) return;
    allButtons.forEach(button => button.classList.toggle('button__hidden'));
    this.#editOn = 1;
    console.log(this.#editOn);
    form.removeEventListener('submit', this._newWorkout.bind(this));
    form.addEventListener('submit', this._editWorkout.bind(this));
  }

  _saveFunction(e) {
    if (e.target !== saveButton) return;
    if (this.askConfirmation() === 'save') {
      console.log('continue to save');
    } else if (this.askConfirmation() === 'cancel') {
      console.log('cancel and do nothing');
    }
  }

  _backFunction(e) {
    if (e.target !== backButton) return;
    if (this.askConfirmation() === 'save') {
      console.log('save function call');
    }
    //call save function

    //else cancel everything and go back to edit
    allButtons.forEach(button => button.classList.toggle('button__hidden'));
    this.#editOn = 0;
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); // converts any object to string
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  askConfirmation() {
    let text = 'Are you sure?';
    if (confirm(text) == true) {
      text = 'save';
    } else {
      text = 'cancel';
    }
    return text;
  }
  ///////////////////////////////////////

  validInputs(...inputs) {
    return inputs.every(input => Number.isFinite(input));
  }
  allPositive(...inputs) {
    return inputs.every(input => input > 0);
  }

  _createRunningWorkout(type, distance, duration, lat, lng) {
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // Number.isFinite(duration) ||
        // Number.isFinite(cadence)
        !this.validInputs(distance, duration, cadence) ||
        !this.allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }
      this.workout = new Running([lat, lng], distance, duration, cadence);
    }
  }

  _createCyclingWorkout(type, distance, duration, lat, lng) {
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration)
      )
        return alert('Cycling Inputs have to be positive numbers');
      this.workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
  }
}

const app = new App();
