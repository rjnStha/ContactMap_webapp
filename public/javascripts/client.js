$(document).ready ( function() {

    L.mapbox.accessToken = "pk.eyJ1Ijoicm9qYW5zdGhhIiwiYSI6ImNqcDJyYmV0ajA5ZjAzcG9oY25vYm9qNDYifQ._mGt3LiCVfvv8ktoGKgWng";
	const map = L.mapbox.map('map2', 'examples.map-h67hf2ic');
    const geocoder = L.mapbox.geocoder('mapbox.places');
    let allMarkers = []

	const marker = {
        icon: L.mapbox.marker.icon({
                  'marker-size': 'medium',
                  'marker-color': '#03ad82'
    })};
 
    $("#isForm").css("display", "none");
    $("#isNotForm").css("display", "block");
    
    tableRowElements = $('tbody').find('tr');

    $('tbody').find('tr').each( function() {
        latitudeLongitude = $(this).find('.latLongData').text();
        let fullName = $(this).find('.contactFullName').text();
        let fullAddress = $(this).find('.contactFullAddress').text();
        let fullContactInfo = fullName + ", " + fullAddress;
        let databaseId = $(this).find('.databaseId').text();

        addMarker( getCompatibleLatLong(latitudeLongitude), fullContactInfo, databaseId );
        addOnClickListenersToUpdate( $(this) );
        addOnClickListenersToDelete( $(this) );
    });

    // on click responder for every tr element inside tbody
    $('tbody').on("click", "tr", function(){
        latLong = $(this).find('.latLongData').text();
        map.setView( getCompatibleLatLong(latLong), 8 );
    });
    
    addOnClickListenersToMarkers();
    addOnClickListenersToNewContact();
        
    $("#updateButton").on("click", function(){
        let data = objectifyForm( $('#mailerForm2').serializeArray() );


        var jax = $.post('contacts', data );
        jax.done( function (data) {


            updateTableRow(data);
            let markerId = data._id? data._id: data.databaseId;
            removeMarker(markerId);

            let fullName = data.firstName + " " + data.lastName + ", ";
            let fullAddress = data.street + ", " + data.city + ", " + data.selectState + " " + data.zip;
            let fullContactInfo = fullName + fullAddress;

            addMarker(data.latlong, fullContactInfo, markerId);
            addOnClickListenersToMarkers();
            
            $("#isForm").css("display", "none");
            $("#isNotForm").css("display", "block");
        });
    });

    function updateTableRow( contact ){
        let parent = $('tbody');

        // If contact already exists
        $('tbody').find('tr').each( function(){
            if( $(this).find('.databaseId').text() == contact.databaseId ){
                //Gotta update the contents of this table row
                updateExistingRow( $(this), contact );
            }
        });

        if(contact.databaseId == "" ){
            // console.log("Reached here");

            //Create a new row and add the new row to the parent
            let newRow = $("<tr> </tr>");
            addTableData(newRow, "contactFullName", contact.title + " " + contact.firstName + " " + contact.lastName, false  );
            addTableData(newRow, "contactFullAddress", contact.street + ", " + contact.city + ", " + contact.selectState + " " + contact.zip, false);
            addTableData(newRow, "contactEmail", contact.email, false);
            addTableData(newRow, "contactPhone", contact.phone, false);
            addTableData(newRow, "contactCanMail", contactMedium(contact.canMail, contact) );
            addTableData(newRow, "contactCanCall", contactMedium(contact.canCall, contact) );
            addTableData(newRow, "contactCanEmail", contactMedium(contact.canEmail, contact) );
            addTableData(newRow, "latLongData", contact.latlong, true);
            addTableData(newRow, "databaseId", contact._id, true);
            addTableData(newRow, "updateButton btn btn-default success", "Update", false);
            addTableData(newRow, "deleteButton btn btn-default danger", "Delete", false);
            addTableData(newRow, "rawContactData", JSON.stringify(contact), true);
            parent.append(newRow);
            addOnClickListenersToUpdate(newRow);
            addOnClickListenersToDelete(newRow);
        }
    }

    function updateExistingRow( rowToUpdate, contact ){
        rowToUpdate.find(".contactFullName").text(contact.title + " " + contact.firstName + " " + contact.lastName);
        rowToUpdate.find(".contactFullAddress").text(contact.street + ", " + contact.city + ", " + contact.selectState + " " + contact.zip);
        rowToUpdate.find(".contactEmail").text( contact.email );
        rowToUpdate.find(".contactPhone").text( contact.phone );
        rowToUpdate.find(".latLongData").text( contact.latlong );
        rowToUpdate.find(".rawContactData").text( JSON.stringify(contact) );
        rowToUpdate.find(".contactCanMail").text( contactMedium(contact.canMail, contact) );
        rowToUpdate.find(".contactCanCall").text( contactMedium(contact.canCall, contact) );
        rowToUpdate.find(".contactCanEmail").text( contactMedium(contact.canEmail, contact ) );
    }

    function addTableData(parent, classes, text, hidden){
        let newTd = $("<td> </td>");
        newTd.addClass(classes);
        newTd.text(text);

        if(hidden)
            newTd.attr("hidden", true);
        
        parent.append(newTd);
    }

    function contactMedium(trueOrFalse, post ){
        if( trueOrFalse || "checkBoxAny" in post)
          return "Yes";
      
        return "No";
      }
    
    function addMarker( latlong, markerToolTipText, id ){

        //marker neeeds latitude longtitude data to be a part of a 2 element array
        let tempMarker = marker;
        tempMarker["title"] = markerToolTipText;

        let marker1 = L.marker(latlong, tempMarker);
        marker1.addTo(map);

        allMarkers.push( {"markerObject" : marker1, "toolTipText" : markerToolTipText, "markerId" : id } );
    }

    function getCompatibleLatLong(rawLatLong){

        let latlong = [];

        //variable rawLatLong is in a string like "41, -74"
        splits = rawLatLong.split(",");
        latlong.push(parseFloat(splits[0]) );
        latlong.push(parseFloat(splits[1]) );

        return latlong;
    }

    function addOnClickListenersToMarkers(){
        for(let i = 0; i < allMarkers.length; i++){
            let markerObject = allMarkers[i].markerObject;
            let markerText = allMarkers[i].toolTipText;
    
            markerObject.on('click', function (ev){
                var layer = markerObject.bindTooltip( markerText );
                layer.toggleTooltip();
            });
        }
    }

    function addOnClickListenersToUpdate( parent ){
        button = parent.find('.updateButton');
        button.on("click", function (){
            let rawData = JSON.parse( parent.find(".rawContactData").text() );
            // console.log(rawData);

            rawData._id = rawData.databaseId == ""? rawData._id : rawData.databaseId;

            // Hide everything in the page except the form
            $("#isNotForm").css("display", "none");
            $("#isForm").css("display", "block");

            //Prepopulate the form
            populateForm(rawData);    
        });
    }

    function populateForm( rawData ){

        $("#firstName2").val(rawData.firstName);
        $("#lastName2").val(rawData.lastName);
        $("#street2").val(rawData.street);
        $("#city2").val(rawData.city);
        $("#zip2").val(rawData.zip);
        $("#phone2").val(rawData.phone);
        $("#email2").val(rawData.email);
        $("#selectState2").val(rawData.selectState);
        $("#dataBaseId2").val(rawData._id);

        //Check title checkboxes
        checkTitleCheckBoxes(rawData);
        checkContactMethod( rawData );
    }

    function checkTitleCheckBoxes( rawData ){
        let checkBoxId = "#title" + rawData.title + "2"; 
        $(checkBoxId).prop('checked', true);
    }

    function checkContactMethod( rawData ){
        if("checkBoxAny" in rawData ){
            $("#checkBoxAny2").prop('checked', true);
            return;
        }
            
        if(rawData.canCall)
            $("#checkBoxPhone2").prop('checked', true);

        if(rawData.canMail)
            $("#checkBoxMail2").prop('checked', true);

        if(rawData.canEmail)
            $("#checkBoxEmail2").prop('checked', true);
    }

    function addOnClickListenersToNewContact(){
        // Hide everything in the page except the form
        let button = $("#createNewContact");

        button.on("click", function () {
            $("#isNotForm").css("display", "none");
            $("#isForm").css("display", "block");

            // May need to reinitialize all form elements
            tempData = {
                            firstName: "",
                            lastName: "",
                            street: "",
                            city: "",
                            zip: "",
                            phone: "",
                            email: "",
                            selectState: "NJ",
                            _id : "",
                            title: "Mr",
                            checkBoxAny: "Any"
                        };
            populateForm(tempData);
            $("#dataBaseId2").val("");
        });
    }

    function addOnClickListenersToDelete( parent ){
        let button = parent.find('.deleteButton');
        button.on("click", function (){
            let dbId = parent.find(".databaseId").text();
            var jax = $.post('contacts', {delete: true, databaseId: dbId});

            jax.done( function (data) {

                deleteTableRow(data.databaseId);

                // console.log(data.databaseId);

                removeMarker(data.databaseId);
                addOnClickListenersToMarkers();
                
                $("#isForm").css("display", "none");
                $("#isNotForm").css("display", "block");
            }); 
        });
    }

    function deleteTableRow(id){
        $('tbody').find('tr').each( function(){
            let rowToDelete = $(this);

            if(rowToDelete.find(".databaseId").text() == id ){
                rowToDelete.remove();
            }
        });
    }

    function objectifyForm(formArray) {//serialize data function

        var returnArray = {};
        for (var i = 0; i < formArray.length; i++){
          returnArray[formArray[i]['name']] = formArray[i]['value'];
        }
        return returnArray;
    }

    function removeMarker( markerId ){
        let markerObject = getMarkerObject(markerId);

        if(!markerObject)
            return;
        
        map.removeLayer(markerObject);

        allMarkers = allMarkers.filter(function(value, index, arr){        
            return value.markerObject != markerObject;
        });
    }

    function getMarkerObject( markerId ){
        for(let i = 0; i < allMarkers.length; i++){
            let oneMarker = allMarkers[i];
            if(oneMarker.markerId == markerId){
                return oneMarker.markerObject;
            }
        }

        return null;
    }

    $("#searchByFirstName").on("keyup", function(){
        // Declare variables
        let input = document.getElementById("searchByFirstName");
        let filter = input.value.toUpperCase();
        let table = document.getElementById("contactsTable");
        let tr = table.getElementsByTagName("tr");

        // Loop through all table rows, and hide those who don't match the search query
        for (let i = 0; i < tr.length; i++) {
            let td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                let fullName = td.textContent;
                let fullNameSplitted = fullName.split(" ");
                let firstName = fullNameSplitted[1];

                let txtValue = firstName; // || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) 
                    tr[i].style.display = "";
                else 
                    tr[i].style.display = "none";
            }
        }
    });

    $("#searchByLastName").on("keyup", function() {
        // Declare variables
        let input = document.getElementById("searchByLastName");
        let filter = input.value.toUpperCase();
        let table = document.getElementById("contactsTable");
        let tr = table.getElementsByTagName("tr");

        // Loop through all table rows, and hide those who don't match the search query
        for (let i = 0; i < tr.length; i++) {
            let td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                let fullName = td.textContent;
                let fullNameSplitted = fullName.split(" ");
                let firstName = fullNameSplitted[2];

                let txtValue = firstName; // || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) 
                    tr[i].style.display = "";
                else 
                    tr[i].style.display = "none";
            }
        }
    });

    /*
    //calculate the nearest distance
    function distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit=="K") { dist = dist * 1.609344 }
            if (unit=="N") { dist = dist * 0.8684 }
            return dist;
        }
    }
    */

});