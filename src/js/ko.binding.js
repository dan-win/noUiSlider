/*
* Binding to use slider for "Knockout JS" views/viewmodels.
* Sample snippet from HTML:
* <div data-bind="nuSlider:{data:MyModel.MyObservable, options: MyModel.options}"></div>
* Supports 2-way binding.
* Allows aoutomatically update options if options is Knockout observable. 
* Working with scalar observable - you can link any observable directly 
* Working with a 2-handle slider - observable must be array with 2 elements,
* the value of unchanged element is "null". 
* @arguments:
* 1. property to bind, can be observable or array of 2 observables (for 2-handle slider).
* 2. "options":options (same as for noUiSlider), can be observable
* 3. "rawOutput":rawOutput: use unencoded value when reading from slider (can be observable).
* Note than undefined values of propertios are not allowed.
* Hint. To avoid passing a large object literal from html,
* define options as a model property and pass reference to the binding.
* sample: data-bind="nuSlider:{data: MyObservable, options: $root.sliderOptions, rawOutput: false}"
*/ 

(function (ko) {

	function updateSliderValues (element, getter) {
		// body...
		var newValue;

		if (getter.length == 2) {
			// 2-handle slider
			newValue = [
				ko.utils.unwrapObservable(getter[0]),
				ko.utils.unwrapObservable(getter[1])
			]
		} else {
			// scalar value
			newValue =  ko.utils.unwrapObservable(getter);
		}

		if (typeof newValue == 'undefined') 
			throw "noUiSlider binding error: observable returns undefined value!";

		element.noUiSlider.set(newValue);
	}

	ko.bindingHandlers.nuSlider = {
		init: function(element, valueAccessor, allBindings) {

			var 
				options = ko.utils.unwrapObservable(valueAccessor()),
				fnGetterSetter = options['data'],
				sliderOptions = ko.utils.unwrapObservable(options['options']),
				useUnencoded = ko.utils.unwrapObservable(options['rawOutput']) || true;

			if (!options)
				throw "noUiSlider binding error: 'options' is required!"

			// create slider object
			noUiSlider.create(element, sliderOptions);

			// install handlers

			function handleSliderChanges ( values, handle, unencoded, tap ) {
				// values: Current slider values;
				// handle: Handle that caused the event;
				// unencoded: Slider values without formatting;
				// tap: Event was caused by the user tapping the slider (bool);

				function processValue (values, targets, handle) {
					// body...
					if (values[handle] === null) {
						return
					}
					if (typeof values[handle] == 'undefined') {
						return
					}
					targets[handle](values[handle]);
				}

				values = (useUnencoded) ? unencoded : values;

				if (fnGetterSetter.length == 2) {
					// 2-handle slider
					processValue(values, fnGetterSetter, 0);
					processValue(values, fnGetterSetter, 1);
				} else {
					// scalar value
					if (typeof values[handle] !== 'undefined') 
						fnGetterSetter(values[handle]);
				}
			}

			function handleObservableOptionsChanges  () {
				if (element.noUiSlider) element.noUiSlider.destroy();
				noUiSlider.create(element, options['options']());
				updateSliderValues(element, fnGetterSetter);
			}

			// Update observable when on slider changes:
			element.noUiSlider.on('update', handleSliderChanges);

			//handle disposal (if KO removes by the template binding)
			ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
				// remove slider object
				if (element.noUiSlider) element.noUiSlider.destroy();
				// dispose subscription if any
				if (element._slider_subscriber_) {
					element._slider_subscriber_.dispose();
					element._slider_subscriber_ = null;
				}
			});

			if (ko.isObservable(options['options'])) {
				// if options is observable, subscribe to changes:
				element._slider_subscriber_ = options['options'].subscribe(handleObservableOptionsChanges );
			}


		},

		update: function(element, valueAccessor, allBindings) {
			// Update slider when observable is changed
			var
				options = ko.utils.unwrapObservable(valueAccessor()),
				fnGetterSetter = options['data'];

			updateSliderValues(element, fnGetterSetter);

		}
	};

})(ko);
