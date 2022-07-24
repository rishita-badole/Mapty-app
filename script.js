'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//refactroing the project architecture using oops
// -----------------ARCHITECTURE-------------------
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapzoomlevel = 13;
  constructor() {
    this._getPosition();
    this._getdata();
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._movetopopup.bind(this));
  }

  //when we have event listners inside the class we always need to bind them as otherwise it will point to the form AAND not app object that we want it to point to.

  //   ----------------function 1 ---------------
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log('coouldnt get your position');
        }
      );
  }

  //   --------------------function ---------------

  //this keyword is undefined in regular function call
  //   ----------------function 2 ---------------

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);
    console.log(this.#map);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //how to handle clicks on map to show the form
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderorkoutarker(work);
    });
  }

  //   ----------------function 3 ---------------

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideform() {
    //clearing the input feilds:
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  //   ----------------function 4 ---------------

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //   ----------------function 5 ---------------

  _newWorkout(e) {
    // helper function--------
    const validinputs = function (...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    };
    const allpositive = function (...inputs) {
      return inputs.every(inp => inp >= 1);
    };
    // -----------------
    e.preventDefault();

    //get data from form -> check if it valid -> if running then create running obj or cycling then cycling object ->then add new obj to workout array ->and render on list and on map too ass marker ->then hide the form and clear the input fields .
    // gettimg data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // if workout running,create running object:
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validinputs(distance, duration, cadence) ||
        !allpositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validinputs(distance, duration, elevation) ||
        !allpositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);
    //
    this._renderworkoutmarker(workout);

    this._renderworkout(workout);

    this._hideform();
    this._setlocals();
    // -------------------------------------------------------

    // console.log(this.#mapEvent);
    // rendering the workout on the map:
    // set local storage for all workouts so that even if we reload those workouts stay.
  }
  //   -------------------function 6----------------
  _renderworkoutmarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description} `
      )
      .openPopup();
  }
  // -------------function 7---------------------
  _renderworkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '
      } </span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === 'running')
      html += `
        <div class="workout__details">
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
    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    form.insertAdjacentHTML('afterend', html);
  }

  _movetopopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapzoomlevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setlocals() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  // get data from local storage :
  _getdata() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
}
// -----------------------------CLASS KHATAM--------------------------------
//creating objects:
const app = new App();
app._getPosition();
//how geolocation works in js: get position function

//displaying a map using leaflet library or third party library
// console.log(firstname);
//other does not have access to scrip.js variables

//what we need to do is get the points or coords of where we click which is not possible only through addevenlistner hence we use leaflet lib

//rendering workout forms

// ---------------------------------------------------------
// -----------WORKOUT CLASS-------------------
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setdescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
// RUNNING CLASS
class running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setdescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
// CYCLING CLASS
class cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setdescription();
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / this.duration / 60;
    return this.speed;
  }
}

// const run1 = new running([39, -12], 5.2, 24, 178);
// const cycle1 = new cycling([39, -12], 27, 95, 253);
// console.log(run1, cycle1);

