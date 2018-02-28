$(document).ready(function () {

    // @TODO: create cancel upload function
    // @author: Zahaire Guro

    var newFileForm = $('#new_file_form');
    var cancel_button = (newFileForm).find('button#cancel_upload');
    var submit_button = (newFileForm).find('button#upload');
    var close_button = (newFileForm).find('button#close_upload');
    var file_input = (newFileForm).find('input#new_file');
    var upload_status = newFileForm.find('p#upload_status');
    var progress = $('div#progress');
    var progressBar = $('#progressBar');
    var upload_modal_trigger = $('button#upload_modal_trigger');

    var fileID = "";

    // refresh files on load
    refresh();

    // ------------------------------------- //
    // FILE RETRIEVE AJAX
    // ------------------------------------- //
    // ------------------------------------- //

    // function to refresh page
    function refresh() {
        $.ajax(
            {
                method: 'GET',
                async: true,
                url: 'get_dir_contents',
                datatype: 'json',
                timeout: 300000
            }
        ).done(
            function (data) {
                data = JSON.parse(data);
                var data = data.current_directory;

                var str = "";
                $.each(data.file, function (i, val) {
                    str += generateRow(val);
                });

                $('#file_browser').empty();
                $('#file_browser').append(str);
            }
        ).fail(
            function (data) {
                //console.log($('#error_modal'));
                var modal = $('#error_modal');

                var errorText =
                    data.status +
                    " " +
                    data.statusText +
                    "<br/>" +
                    "Error in fetching the files";

                modal.find('.modal-body p#error_code')[0].innerHTML = errorText;
                console.log(data);
                $('#error_modal').modal('show');
            }
        );
    }

    // table row string builder
    function generateRow(row) {
        // build string to return
        var str = "";

        // get name of who create/modified the file
        var user = getUser(row.updated_by).responseJSON;
        var modifier_name = user.first_name + " " + user.last_name;

        // build tr opening and closing tags
        var trOpeningTag_str = "<tr id='file[" + row.id + "]'>";
        var trClosingTag_str = "</tr>";

        // declare td css classes
        var tdAdditionalClasses_CSS = "align-middle";
        // declare td css styles
        var tdAdditionalStyle_CSS = "";

        // build td opening tag
        var tdOpeningTag_str =
            "<td class='" + tdAdditionalClasses_CSS +
            "' style='" + tdAdditionalStyle_CSS + "'>";

        var tdClosingTag_str = "</td>";

        // content html of each td

        // build file icon
        var fileIcon_str = "<span class='fas fa-file fa-2x mr-5'></span>";

        var fileName_str = // file name
            tdOpeningTag_str +
            "<p class='table-row-first'>" +
            fileIcon_str + // file icon
            row.name +
            "</p>" +
            tdClosingTag_str;

        var fileCreated_str = // date created
            tdOpeningTag_str +
            "<p class='text-secondary'>" + row.created_at + "</p>" +
            tdClosingTag_str;

        var fileModified_str = // last modified
            tdOpeningTag_str +
            "<p class='text-secondary'>" + row.updated_at + "</p>" +
            tdClosingTag_str;

        var fileModifiedBy_str = // last modified
            tdOpeningTag_str +
            "<p class='text-secondary'>" + modifier_name + "</p>" +
            tdClosingTag_str;

        var fileSize_str = // last modified
            tdOpeningTag_str +
            "<p class='text-secondary'>" + row.size + " KB</p>" +
            tdClosingTag_str;

        var fileDownloadLink_str = // download button
            "<a href='" + row.source +
            "' download='" + row.name +
            "' target='_blank' " +
            "class='btn btn-success m-2'>" +
            "<i class='fas fa-download fa-1x'></i>" +
            "</a>";

        var fileDeleteButton_str = // delete button
            "<button type='button' " +
            "data-toggle='modal' " +
            "class='btn btn-danger m-2' " +
            "data-target='#delete_modal' " + // what modal to target
            "data-fileid='" + row.id + "'>" + // new data-* field to dynamically vary modal content
            "<i class='fas fa-trash fa-1x'></i></button>"; // delete button icon

        var lastcolumn =
            tdOpeningTag_str +
            "<div class='float-right mr-5'>" +
            fileDownloadLink_str +
            fileDeleteButton_str +
            "</div>" +
            tdClosingTag_str;

        str =
            trOpeningTag_str +
            fileName_str +
            fileCreated_str +
            fileModified_str +
            fileModifiedBy_str +
            fileSize_str +
            lastcolumn +
            trClosingTag_str;

        return str;
    }


    // ------------------------------------- //
    // FILE UPLOAD AJAX
    // ------------------------------------- //
    // ------------------------------------- //

    // reset buttons to default states
    upload_modal_trigger.click(function () {

        // cancel button
        if (cancel_button.hasClass('btn-primary')) {
            cancel_button.removeClass('btn-primary');
        }
        if (cancel_button.hasClass('btn-danger')) {
            cancel_button.removeClass('btn-danger');
        }
        cancel_button.addClass('btn-secondary');
        cancel_button.text('Close');

        // submit button
        if (submit_button.hasClass('btn-success')) {
            submit_button.removeClass('btn-success');
        }
        if (submit_button.hasClass('btn-warning')) {
            submit_button.removeClass('btn-warning');
        }
        submit_button.addClass('btn-primary')
            .removeAttr('disabled')
            .text('Upload');

        // file input
        file_input.removeAttr('hidden');

        // close button
        close_button.removeAttr('hidden');

        // progress bar
        progress.attr('hidden', 'true');
        upload_status.attr('hidden', 'true');
    });

    newFileForm.submit(
        function (e) {
            e.preventDefault();

            // Show progress bar and change button context
            cancel_button.removeClass('btn-secondary')
                .addClass('btn-danger')
                .text('Cancel');

            submit_button.removeClass('btn-primary')
                .addClass('btn-warning')
                .attr('disabled', 'true')
                .text('Uploading...');

            progress.removeAttr('hidden');

            file_input.attr('hidden', 'true');

            close_button.attr('hidden', 'true');

            $.ajax({
                xhr: function () { // loader logic
                    var xhr = new window.XMLHttpRequest();

                    xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            var percent = Math.round((e.loaded / e.total)) * 100;
                            console.log(percent);
                            progressBar.attr('aria-valuenow', percent).css('width', percent + '%');
                        }
                    });

                    return xhr;
                },
                url: 'add_file',
                type: 'POST',
                data: new FormData(this),
                contentType: false,
                cache: false,
                processData: false,
                timeout: 3600000,
            }
            ).done(
                function (data) {
                    refresh();
                    cancel_button.removeClass('btn-danger')
                        .addClass('btn-primary')
                        .text('Close');

                    submit_button.removeClass('btn-warning')
                        .addClass('btn-success')
                        .attr('disabled', 'true')
                        .text('Upload Complete!');

                    close_button.removeAttr('hidden');

                    upload_status.removeAttr('hidden')
                        .text('Your file has been uploaded!');

                    progressBar.addClass('bg-success');
                }
            ).fail(
                function (data) {
                    cancel_button.removeClass('btn-danger')
                        .addClass('btn-primary')
                        .text('Cancel');

                    submit_button.removeClass('btn-primary')
                        .addClass('btn-warning')
                        .attr('disabled', 'true')
                        .text('Error');

                    file_input.attr('hidden', 'true');

                    close_button.attr('hidden', 'true');

                    progressBar.addClass('bg-danger');
                }
            );
        }
    );


    // ------------------------------------- //
    // MODALS
    // ------------------------------------- //
    // ------------------------------------- //

    // dynamically generate delete modal contents
    $('#delete_modal')
        .on(
            'show.bs.modal',
            function (event) {
                var rowFileID = $(event.relatedTarget).data('fileid'); // Extract info button's from data-* attributes
                var modal = $(this);
                
                fileID = rowFileID;

                console.log('modal show fileIDs: ' + fileID);
            }
        );

    $('#deleteFile_btn').click(
        function (e) {
            e.preventDefault();
            console.log('delete btn fileID: ' + fileID);

            $.ajax({
                method: 'GET',
                async: true,
                url: 'delete_file/' + fileID,
                datatype: 'json'
            }
            ).done(
                function (data) {
                    refresh();
                }
            ).fail(
                function (data) {
                    console.log (data + " error");
                }
            );

            $('#delete_modal').modal('hide');
        }
    )

});