$(function () {
    "use strict";

    var resetUnobtrusive = function (form) {
        if (form && form.length) {
            form.off("submitBtn"); // remove previous click event

            form.removeData('validator');
            form.removeData('unobtrusiveValidation');
            $.validator.unobtrusive.parse(form);

            var formData = form.data("validator");
            if (formData) {
                formData.settings.ignore = ":hidden:not(.AlwaysValidate), .SkipValidation";
            }
        }
    };

    // Focus first relevant field to use
    if ($("#AssertionModel_InResponseTo").val()) {
        $("#AssertionModel_NameId").focus().select();
    } else {
        $("#AssertionModel_AssertionConsumerServiceUrl").focus().select();
    }

    var attributeCount = 0;

    $("#add-attribute").click(function (e) {

        e.preventDefault();
        var rowInfo = {
            rowIndex: attributeCount
        };
        var newRow = ich.attributeRowTemplate(rowInfo);
        $("#attributes-placeholder").append(newRow).show();
        resetUnobtrusive($("form"));
        attributeCount++;
    });

    $("body").on("click", ".remove-attribute", function (e) {
        e.preventDefault();
        $(e.target).closest(".attribute-row").remove();
    });

    $("body").on("click", ".show-details", function (e) {
        e.preventDefault();
        $(".show-details").hide();
        $(".hide-details").show("fast");
    });

    var users = {};
    var urlStart = window.location.pathname + "/";
    if (window.location.pathname[window.location.pathname.length - 1] === '/') {
        urlStart = window.location.pathname;
    }
    $.getJSON(urlStart + "Manage/CurrentConfiguration", null, function (data, textStatus, jqXHR) {
        if (data.UserList) {
            $.each(data.UserList, function (indexInArray, valueOfElement) {
                users[valueOfElement.Assertion.NameId] = valueOfElement;
            });

            $("#user-dropdown-placeholder").html(ich.userListTemplate(data));
            $("#userList").focus();
            if (data.HideDetails || typeof (data.HideDetails) === "undefined") { // default == true
                $(".hide-details").hide();
            } else {
                $(".show-details").hide();
            }

            restoreSelectedUser();
        }
    });

    $("body").on("change", "#userList", function () {
        var selectedUserId = $(this).val();
        var user = users[selectedUserId];
        $("#AssertionModel_NameId").val(selectedUserId);
        if (user && user.Description) {
            $("#userDescription").text(user.Description);
        }
        else {
            $("#userDescription").text('');
        }

        $(".attribute-row").remove();

        attributeCount = 0;
        if (user && user.Assertion && user.Assertion.AttributeStatements) {
            $.each(user.Assertion.AttributeStatements, function (idx, element) {

                var rowInfo = {
                    type: element.Type,
                    value: element.Value,
                    rowIndex: attributeCount
                };
                var newRow = ich.attributeRowTemplate(rowInfo);
                $("#attributes-placeholder").append(newRow).show();
                attributeCount++;
            });
            resetUnobtrusive($("form"));
        }
    });

    var cookieName = 'stubIdp.username';

    var restoreSelectedUser = function () {
        var selectedUserId = Cookies.set(cookieName);
        if (selectedUserId && $("#userList").find("option[value=" + selectedUserId + "]").length > 0) {
            $("#userList").val(selectedUserId);
            $("#userList").change();
            $("#submitBtn").focus();
        }
    };

    $("body").on("submit", "form", function (e) {
        var placeholder = $("#post-binding-form-placeholder");
        if (!placeholder || placeholder.length == 0) {
            // Not the IDP page, could be discovery service
            return;
        }
        // Remember the selected user in a cookie
        var selectedUserId = $("#userList").val();
        Cookies.set(cookieName, selectedUserId, { expires: 365, path: '' }); // path: '' ensures that a separate cookie is created for each named sub-IDP

        // Get the post binding page by an ajax post call
        // If we don't have JavaScript enabled in the browser the normal form post will still transfer to the post-binding-page.
        e.preventDefault(); // block normal form submit and instead make an ajax call, 
        var form = $(this);
        var submitUrl = form.attr("action");
        $.post(submitUrl, form.serialize()).success(function (data, status, jqXHR) {
            // This is a bit hacky, we get the post binding page, cut'n paste the form into our own page into a placeholder element and submit the form from here
            // That way we don't end up on the post binding page waiting for the SP
            var postBindingPage = $(data);
            var postBindingForm = postBindingPage.find("form");
            if (postBindingForm.length == 0) {
                postBindingPage.each(function (idx, elem) {
                    if ($(elem).is("form")) {
                        postBindingForm = $(elem);
                    }
                });
            }
            if (postBindingForm.find("input").length == 1 && postBindingForm.find("input")[0].name == "SAMLResponse") {
                // We got the post binding form, paste it in the placeholder and submit
                placeholder.empty().append(postBindingForm);
                var placeholderForm = placeholder.find("form");
                placeholderForm[0].submit();
            }
            else {
                // Oops, we didn't get the post binding form, retry submitting the form the normal way
                // Typically server side validation error, the best thing is to reload the page the normal way
                form[0].submit();
            }
        });
    });
});