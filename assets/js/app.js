$(function() {
  $('[data-toggle=primary]').on('click', function(e) {
      e.preventDefault();
      $('body').toggleClass('menu-active');
  })

  $('[data-inline-svg]').inlineSvg();

  $('[data-background-url]').each(function(index) {
      $backgroundImg = $(this).data('background-url');
      $(this).css('background-image', "url(" + $backgroundImg + ")");
  });

  $('body').tooltip({
      selector: '[data-toggle="tooltip"]'
  });

  $(".nav-tabs a").click(function(e) {
      e.preventDefault();
      $(this).tab('show');
  });


  //lets stop all default form posting - we want ajax!
  $(document).on('submit', 'form', function(event) {
      event.preventDefault();
      event.stopPropagation();
  });


  $('#contact-form').on('submit', function() {
      let form = document.querySelector('#' + this.id);
      if (form.checkValidity()) {
          //lets pretend we submitted successfully. We have some animation chaining happening here too,
          //to show sucess alert and then fade the form back in. Yayness!
          $(this).fadeOut(500, function(e) {
              $(this).next('[role="alert"]').fadeIn(300).delay(3000).fadeOut(300);
          }).delay(3600).fadeIn(500);
          $(this).trigger('reset');

      } else {
          $(this).addClass('was-validated');
      }

  });

});