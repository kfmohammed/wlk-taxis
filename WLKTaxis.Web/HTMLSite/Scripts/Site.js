
//All all the events and initialise the calendar.
function GetEvents()
{
    $.ajax({
        url: '/home/Events',
        type: 'GET',
        //data: JSON.stringify({ parkDate: parkdate }),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            initialiseCalendar(data);
        }
    ,
        error: function (error) {
            alert("Unfortunately that action can no longer be taken.");
        }
    });
}

//Get the single events, i.e See if there are any spaces available.
function HasDayGotAvailability(parkdate) {
    var result = false;

    $.ajax({
        url: '/home/Events',
        type: 'POST',
        data: JSON.stringify({ parkDate: parkdate }),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            result = data
        },
        error: function (error) {
            alert("Unfortunately that action can no longer be taken.");
        }
    });

    return result;
}


function InitialiseSubmitPost()
{
    //Set the modal submit to be a AJAX post
    $('#modalConfirmationSubmit').on('click', function (event) {
        ActionEvent();
    });
}

function ActionEvent()
{
    var status = $('#hiddenCurrStatus').val();
    var parkdate = $('#hiddenParkDate').val();

    if (!status)
        status = 0;

    $.ajax({
        url: '/home/ActionEvent',
        type: 'POST',
        data: JSON.stringify({ parkDate: parkdate, currentEventtype: status }),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            $('#hiddenCurrStatus').val("");
            $('#hiddenParkDate').val("");
            $("#confirmationModal").modal('toggle');
            initialiseCalendar(data.data, parkdate);

            if (data.toastrMessageType === "Warning")
                toastr.warning(data.toastrMessageString, "Parking Space", { "positionClass": "toast-top-full-width", "preventDuplicates": true });

            if (data.toastrMessageType === "Success")
                toastr.success(data.toastrMessageString, "Parking Space", { "positionClass": "toast-top-full-width", "preventDuplicates": true });

        }
        ,
        error: function (error) {
            toastr.error("Unfortunately there was an error undertaking that operation.", "Parking Space", { "positionClass": "toast-top-full-width", "preventDuplicates": true });
            //alert("Unfortunately there was an error undertaking that operation.");
        }
    });
}

function initialiseCalendar(eventData, parkingDate) {
    var month = 0;
    var showPrevious = 0;
    var showNext = 1;
    if (parkingDate != undefined) {
        var parts = new Date(parkingDate)
        month = parts.getMonth() + 1;

        //Set Navigation buttons
        now = new Date();
        if ((month > now.getMonth() + 1)||((now.getMonth() + 1)==12 && (month ==1)))
        {
            showPrevious = 1;
            showNext = 0;
        }

       
    }
    else
    {
        now = new Date();
        month = now.getMonth() + 1;
    }


    $("#calendar").empty();
    $("#calendar").zabuto_calendar({
        show_previous: showPrevious,
        show_next: showNext,
        month: month,
        data: eventData.Events,
        action: function (event) {
            var eventType = $(this).attr("currparkingstatus");
            var isBankHoliday = $(this).attr("bankholiday") === 'true';
            var parkingDate = $(this).children("div").attr("data-date");
            var carSharer = eventData.CarSharer;
                        
            var pDate = new Date(parkingDate);
            var TodaysDate = new Date();
            TodaysDate.setDate(TodaysDate.getDate() - 1);

            //Ensure that people arent booking a spot on a weekend
            if ($(this).children("div").attr("data-day") < 5 && (pDate >= TodaysDate) && !isBankHoliday) {
                
                HandleParkingEventTypeChanges(parkingDate, eventType, carSharer);
            }
        }
    });
}


function HandleParkingEventTypeChanges(parkdate, eventType, isCarSharer) {
    $('#parkingTitle').text("Parking - " + parkdate);
    $('#hiddenCurrStatus').val(eventType);
    $('#hiddenParkDate').val(parkdate);

    SetCarSharerWarningVisibility(isCarSharer);
    //Release= 1,
    //Reserve =2,
    //LongTermRelease=3,
    //HolidayAbsence=4

    switch (eventType)
    {
        case "1":
            //if you have released it, do you want to reclaim it
            SetReclaimSpaceVisibility();
            $("#confirmationModal").modal('toggle');
            break;
        case "2":
            SetReleaseSpaceVisibility()
            $("#confirmationModal").modal('toggle');
            break;
        case "3":
            //if you have released it, do you want to reclaim it
            SetReclaimSpaceVisibility();
            $("#confirmationModal").modal('toggle');
            break;
        case "4":
            //if holiday or absense then its set by workday
            SetWorkdayVisibility();
            $("#confirmationModal").modal('toggle');
            break;
        case "5":
        case "6":
            SetReleaseSpaceVisibility()
            $("#confirmationModal").modal('toggle');
            break;
        default:


            $.ajax({
                url: '/home/HasSpacesAvalaible',
                type: 'POST',
                data: JSON.stringify({ parkDate: parkdate }),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    if (data)
                    {
                        SetSpacesAvailableVisibility();
                        $("#confirmationModal").modal('toggle');
                    } else
                    {
                        SetNoSpacesAvailableVisibility();
                        $("#confirmationModal").modal('toggle');
                    }
                }
   ,
                error: function (error) {
                    alert("Unfortunately that action can no longer be taken.");
                }
            });
            break;
    }

}

function GetCarparks(id) {
    //$("#CarparkGroup").Show();
    var procemessage = "<option value='0'> Please wait...</option>";
    $("#ddlCarParks").html(procemessage).show();

    var url = "/Visitor/GetCarparks";

    $.ajax({
        url: "/visitor/GetCarparks",
        type: "POST",
        data: JSON.stringify({ officeId: id }),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            var markup = "<option value='0'>Select Car Park</option>";
            for (var x = 0; x < data.length; x++) {
                markup += "<option value=" + data[x].Id + ">" + data[x].Description + "</option>";
            }
            $("#ddlCarParks").html(markup).show();
        },
        error: function (reponse) {
            debugger;
            alert("error : " + reponse);
        }
    });

}

function SetCarSharerWarningVisibility(carSharer)
{
    if (carSharer == true) {
        $(".CarSharersWarning").show();
    } else
    {
        $(".CarSharersWarning").hide();
    }
}

function SetSpacesAvailableVisibility()
{
    $(".SpacesAvailable").show();
    $(".ReclaimSpace").hide();
    $(".ReleaseSpace").hide();
    $(".NoSpacesAvailable").hide();
    $(".Workday").hide();
    $("#modalConfirmationSubmit").show();

}

function SetReclaimSpaceVisibility() {
    $(".SpacesAvailable").hide();
    $(".ReclaimSpace").show();
    $(".ReleaseSpace").hide();
    $(".NoSpacesAvailable").hide();
    $(".Workday").hide();
    $("#modalConfirmationSubmit").show();

}

function SetReleaseSpaceVisibility() {
    $(".SpacesAvailable").hide();
    $(".ReclaimSpace").hide();
    $(".ReleaseSpace").show();
    $(".NoSpacesAvailable").hide();
    $(".Workday").hide();
    $("#modalConfirmationSubmit").show();

}


function SetNoSpacesAvailableVisibility() {
    $(".SpacesAvailable").hide();
    $(".ReclaimSpace").hide();
    $(".ReleaseSpace").hide();
    $(".NoSpacesAvailable").show();
    $(".Workday").hide();
    $("#modalConfirmationSubmit").hide();

}

function SetWorkdayVisibility() {
    $(".SpacesAvailable").hide();
    $(".ReclaimSpace").hide();
    $(".ReleaseSpace").hide();
    $(".NoSpacesAvailable").hide();
    $(".Workday").show();
    $("#modalConfirmationSubmit").hide();

}
