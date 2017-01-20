$(document).ready(function() {
  // Intercept submit button click
  $("#passcodeButton").click(function() {
    getQSA();
  });
  // Intercept enter key in passcodeInput field
  $("#passcodeInput").keypress(function(e) {
    if(e.which == 13) getQSA();
  })

  function getQSA() {
    if($("#passcodeInput").val()) { // passcode field required
      $("#passcodeMessage").html("Validating passcode...").show();

      // Iterate through the presentation links to get signed hrefs
      $(".presentation").each(function(i, obj) {
        var thisPresentation = $(this); // this isn't that when it's over there

        // Make an API call to getqsafromcode/ for each presentation link.
        // Provide entered passcode and presentation href, receive error or signed URL.
        var data = {
          "passcode": $("#passcodeInput").val(),
          "hrefurl": $(this).attr('href')
        };
        $.ajax({
          url: "https://nf99b8wk5k.execute-api.us-west-2.amazonaws.com/V1/getqsafromcode/",
          dataType: 'json',
          type: 'POST',
          data: JSON.stringify(data),
          cache: false,
          // Handle errors completing the API call
          error: function(xhr, status, error) {
            $("#passcodeMessage").html("Sorry, I appear to be having backend issues. Please try again later.");
            return false; // return false to break .each()
          },
          // API call completed successfully, check response for error or signed URL
          success: function(res) {
            if(res.errorMessage) {
              $("#passcodeMessage").html(res.errorMessage);
              return false; // return false to break .each()
            } else {
              thisPresentation.attr('href',res).show();
              $("#passcodeDiv").hide();
              $("#passcodeMessage").html("Passcode accepted");
            }
          } // End success:
        }); // End .ajax()
      }); // End .each()
    } // End if passcodeInput
  }; // End getQSA()
}); // End document ready()
