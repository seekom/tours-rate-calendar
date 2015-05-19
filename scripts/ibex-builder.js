// The datepicker calendar is courtesy of http://jqueryui.com/demos/datepicker/ where there is full documentation
	// The datepicker calendar uses the "jquery-ui" javascript framework http://jqueryui.com/

	// This function is called after the DOM has been loaded by the browser and ...
	// 1. Initialises the datepicker including setting its "onHideStart" event to reload the iBex data following a date change
	// 2. Calls ibexBuilder.GetData to do the initial data load
	$(function() {
		$('#calStartDate').datepicker({
			dateFormat: 'yy-mm-dd',
			onSelect: function(dateText, inst){
				ibexBuilder.GetData(dateText);
			},
			showOn: 'both',
			buttonImage: 'dashboard-icon.gif',
			buttonImageOnly: true
		});
		ibexBuilder.GetData(ibexBuilder.StartOffsetDays);
	});

	// The following functions define the functionality to dynamically build the rate table HTML including actions to be taken
	// when the user clicks the Prev or Next buttons or clicks a day cell to load the iBex booking page

	/**
	 * Defines HTML templates used by the Build function
	 *
	 */
	ibexBuilder.Initialise = function()
	{
		// Day of week and month names used in the calendar
		this.dow = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
		this.months = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');

		// The HTML templates contain substitution points of the form {SomeName} which are replaced with the variable data in the build process

		// NOTE Null link <a> elements normally have href="#" however this form cannot be used in this HTML.
		// However the hover cusror pointer functionality usually associated with a link element will still be functional
		// as long as CSS class "addToolTip" or "nullLink" is specified for the element

		// Header row and columns
		this.htmlTable = '<table class="calendarTable" border="1" cellpadding="3" cellspacing="0" bordercolor="#FFFFFF" width="100%">';
		this.htmlHdrRow = '<tr class="header">';
		this.htmlHdrColName = '<td width="{ColWidths.Name}">Tour Type/Package<br><i>Rate Name</i></td>';
		this.htmlHdrColGuests = '<td width="{ColWidths.Guests}" class="center">Max<br>Group</td>';
		this.htmlHdrColMinStay = '<td width="{ColWidths.MinStay}" class="center">Min&nbsp;Stay<br>(nights)</td>';
		this.htmlHdrColDay = '<td width="{ColWidths.Days}" class="center">{DateDow}<br>{DateText}</td>';

		// Main body and columns
		this.htmlRow = '<tr class="{OddEven}row">';
		this.htmlColName = '<td class="roomrate" rowspan="{MinStaysCount}">{RoomDetails}<br><i>{RateDetails}</i></td>';
		this.htmlColGuests = '<td class="maxguests" rowspan="{MinStaysCount}" align="center">{RateMaxPax}</td>';
		this.htmlColMinStay = '<td class="minstay" align="center">{MinStay}</td>';
		this.htmlColDaySold = '<td class="sold">-</td>';
		this.htmlColDayAvail = '<td class="{AvailClass}_{OddEven}">{DayDetails}</td>';

		// Room and Rate details content within the Name column
		this.htmlRoomDetails = '<a class="addToolTip" title="<div id=\'ToolTipTextWrap\'>Tour</div>{RoomDesc}">{RoomName}</a>';
		this.htmlRateDetails = '<a class="addToolTip" title="<div id=\'ToolTipTextWrap\'>Rate</div>{RateDesc}">{RateName}</a>';

		// Avaialability and Rate details content within the Day column
		this.htmlDayDetails = '<a onclick="ibexBuilder.GoToPage(\'{DateYmd}\', {MinStay}, {RoomId}, {RateId},\'{CustomUrl}\')"' +
								 'class="addToolTip" title="<div id=\'ToolTipTextWrap\'>Click to book</div><p>{AvailabilityInfo}</p>">{RoomRate}</a>';


		// Write the text to the Prev / Next links
		document.getElementById('calendarPrev').innerHTML = '&lt;&lt; Prev ' + ibexBuilder.NoOfDays + ' Days';
		document.getElementById('calendarNext').innerHTML = 'Next ' + ibexBuilder.NoOfDays + ' Days &gt;&gt;';

	}


	/**
	 * Called if an error is detected during data retrieval
	 *
	 * @param string error
	 */
	ibexBuilder.OnError = function(error)
	{
		// Turn off the "busy" message
		document.getElementById("calendarBusy").style.display = "none";

		alert(error);
	}


	/**
	 * Called just prior to the asynchronous call to the server to retrieve data
	 * Can be used to set a "busy" indicator
	 *
	 */
	ibexBuilder.ShowBusy = function()
	{
		// Set the "busy" message
		document.getElementById("calendarBusy").style.display = "inline";
		
		var calendarContent = document.getElementById('calendarContent');
		calendarContent.setAttribute('class', 'content-busy');
	}


	/**
	 * Called when the calendar "Previous" button / link is clicked
	 *
	 */
	ibexBuilder.PrevPeriod = function()
	{
		this.GetData(-this.NoOfDays);
	}


	/**
	 * Called when the calendar "Next" button / link is clicked
	 *
	 */
	ibexBuilder.NextPeriod = function()
	{
		this.GetData(this.NoOfDays);
	}


	/**
	 * Called when the calendar "Click to book" button / link is clicked
	 *
	 * @param string stDate the date selected in yyyy-mm-dd format
	 * @param int minStay the selected min stay value
	 * @param int roomId the iBex room ID
	 * @param int rateId the iBex rate ID
	 * @param string customUrl optional URL of external booking system
	 */
	ibexBuilder.GoToPage = function(stDate, minStay, roomId, rateId, customUrl)
	{
		var endDate = new Date(this.DateFromString(stDate));
		endDate.setDate(endDate.getDate() + minStay);

		var sep, url, target = this.TargetWindow;
		if (customUrl === '')
		{
			sep = this.TargetUrl.indexOf('?') < 0 ? '?' : '&';
			url = this.TargetUrl + sep + 'op=' + this.OperatorId + '&pid=' + this.PropertyId +
											   (this.TargetRegUserId != '' ? ('&ru=' + this.TargetRegUserId) : '') +
											   '&datein=' + stDate + '&dateout=' + this.DateToString(endDate) +
											   '&room=' + roomId + '&rate=' + rateId;
		}
		// Custom URL
		else
		{	
			sep = customUrl.indexOf('?') < 0 ? '?' : '&';

			url = customUrl + sep + 'datein=' + stDate + '&dateout=' + this.DateToString(endDate);
			target = '_blank';
		}	
		
		// Fix for Safari browser
		if(this.TargetSafariFix != ''){
			  var redirectURL = encodeURIComponent(url);
			  var url = this.TargetSafariFix + '?url=' + redirectURL;
		}
		
		var newWindow = window.open(url, target);

		try
		{
			newWindow.focus();
		}
		catch(e) {}
	}



	/**
	 * Called when the asynchronous call to the server has completed and the data is available
	 *
	 * @param iBexRooms data the iBexRooms object containing the retrieved data
	 */
	ibexBuilder.Build = function(data)
	{
		// First time call the Initialise function
		if (this.htmlTable == null) this.Initialise();

		// For testing can print the retrieved data to the browser
		//this.Print(data);

		// Save the days of the retrieved data and set the calendar date text
		this.StartDate = data.StartDate;
		this.EndDate = data.EndDate;

		document.getElementById('calStartDate').value = this.DateToString(this.StartDate);

		// Start the calendar <table ...> build
		var html = this.htmlTable +
				   this.htmlHdrRow;
		
		// Tour/Rate Name column present only if ShowTourName option selected
		if (this.ShowTourName) html += this.htmlHdrColName.replace("{ColWidths.Name}", this.ColWidths.Name)
		
		// MaxGuest column present only if ShowGuest option selected
		if (this.ShowMaxGuest) html += this.htmlHdrColGuests.replace("{ColWidths.Guests}", this.ColWidths.Guests);

		// MinStay column present only if AllMinStays option selected
		if (this.AllMinStays) html += this.htmlHdrColMinStay.replace("{ColWidths.MinStay}", this.ColWidths.MinStay);
		
		// Iterate through the selected days and add the Day columns
		var day = new Date(this.StartDate);
		for (var dayCt = 0; dayCt < this.NoOfDays; dayCt++)
		{
			var dateText = '0' + day.getDate();
			dateText = dateText.substr(dateText.length - 2) + ' ' + this.months[day.getMonth()];
			html += this.htmlHdrColDay.replace("{ColWidths.Days}", this.ColWidths.Days).replace("{DateDow}", this.dow[day.getDay()]).replace("{DateText}", dateText);

			day.setDate(day.getDate() + 1);
		}

		var rowNo = 0, oddEven = new Array('odd', 'even');

		// Now iterate through the iBexRooms.Rooms data
		for (var roomKey = 0; roomKey < data.Rooms.length; roomKey++)
		{
			var room = data.Rooms[roomKey];
			
			// Iterate through the iBexRoom.Rates data
			for (var rateKey = 0; rateKey < room.Rates.length; rateKey++)
			{
				var rate = room.Rates[rateKey], rowType = oddEven[rowNo++ % 2], roomRateRow = true;


    			// Iterate through the iBexRate.MinStays data
				for (var minStayKey = 0; minStayKey < rate.MinStays.length; minStayKey++)
    			{
    				var minStay = rate.MinStays[minStayKey];

    				// Unavailable min stays is hidden only if their no rate for this min stay and HideUnavailMinStays option selected
    				if(this.AllMinStays && this.HideUnavailMinStays){
        				if(minStay.HasAvailability === false){
        					continue;
        				}
    				}
    				
    				// End previous row and start new one
					html += '</tr>' +
							this.htmlRow.replace("{OddEven}", rowType);

					// The Name and Guest columns are only present at the start of a new Rate and span all the MinStay rows for the rate
					if (roomRateRow)
					{
						var roomDescTrunc = room.Desc.length > 250 ? (room.Desc.substr(0, 250) + ' ...') : room.Desc;
						var rateDescTrunc = rate.Desc.length > 250 ? (rate.Desc.substr(0, 250) + ' ...') : rate.Desc;
						var roomHtml = roomDescTrunc == '' ? room.Name : this.htmlRoomDetails.replace("{RoomDesc}", roomDescTrunc).replace("{RoomName}", room.Name);
						var rateHtml = rateDescTrunc == '' ? rate.Name : this.htmlRateDetails.replace("{RateDesc}", rateDescTrunc).replace("{RateName}", rate.Name);

						html += this.htmlColName.replace("{MinStaysCount}", rate.MinStays.length).replace("{RoomDetails}", roomHtml).replace("{RateDetails}", rateHtml) +
								this.htmlColGuests.replace("{MinStaysCount}", rate.MinStays.length).replace("{RateMaxPax}", rate.MaxPax);

	    				roomRateRow = false;
					}

					// MinStay column present only if AllMinStays option selected
    				if (this.AllMinStays) html += this.htmlColMinStay.replace("{MinStay}", minStay.MinStay);


    				// Iterate through the selected days and add the Day cells
					day = new Date(data.StartDate);
					for (var dayCt = 0; dayCt < this.NoOfDays; dayCt++)
					{
						var dayInfo = minStay.GetDay(day);

						// Either a "Sold" cell ...
						if (dayInfo.Status == 'Unavailable') html += this.htmlColDaySold;

						// otherwise an "Available" or "Request" cell
						else
						{
							var availClass = dayInfo.Status == 'Instant Confirmation' ? 'available' : 'onreq';

							var availInfo = dayInfo.Available + ' place' + (dayInfo.Available > 1 ? 's' : '') + ' available<br>'  +
										    'Rate ' + (rate.BasePax > 1 ? ('for ' + rate.BasePax + ' people') : 'per person') + '<br>';

							var roomRate = data.CurrencySymbol + Math.round(parseInt(dayInfo.BaseRate));

							var dayDetails = this.htmlDayDetails.replace("{DateYmd}", this.DateToString(day)).replace("{MinStay}", dayInfo.MinStay);
							dayDetails = dayDetails.replace("{RoomId}", room.Id).replace("{RateId}", rate.Id);
							dayDetails = dayDetails.replace("{CustomUrl}", data.CustomUrl);
							dayDetails = dayDetails.replace("{AvailabilityInfo}", availInfo).replace("{RoomRate}", roomRate);

							html += this.htmlColDayAvail.replace("{AvailClass}", availClass).replace("{OddEven}", rowType).replace("{DayDetails}", dayDetails);

						}

						// Increment the date
						day.setDate(day.getDate() + 1);

					} // End day

    			} // End minstay

			} // End rate

		} // End room


		// Finalise the HTML and write it to the its container
		html += '</tr></table>';

		var calendarContent = document.getElementById('calendarContent');
		var colorScheme = (typeof this.CustomColorScheme === 'undefined' || this.CustomColorScheme === '' ? 'navy' : this.CustomColorScheme);
		
		calendarContent.innerHTML = html + '<div class="loading-calendar"></div>';
		calendarContent.setAttribute('class', colorScheme.toLowerCase());
		// For testing can print the generated HTML to the browser
		// this.Print(html, true); 

		// This rebuilds the mootools ToolTips
		addwarning();

		// Finally turn off the "busy" message
		document.getElementById("calendarBusy").style.display = "none";
		
		iframeResizePipe();
	}
	
	/**
	 * Calculate the size of the content
	 */
	function iframeResizePipe()
	{
		// What's the page height?
		var height = document.body.scrollHeight;

		// Going to 'pipe' the data to the parent through the helpframe..
		var pipe = document.getElementById('ibex-frame');
		
		// Cachebuster a precaution here to stop browser caching interfering
		pipe.src = ibexBuilder.ibexHelper + '?height='+height+'&cacheb='+Math.random();
	}