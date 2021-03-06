with (scope('DeveloperBox','Issue')) {

  // wrapper for content you want hidden if the solution is accepted
  define('hide_if_solution_accepted', function() {
    return div({ 'class': 'dev-box-hide-if-solution-accepted' }, arguments);
  });

  define('create', function(issue) {
    DeveloperBox.issue = issue;
    DeveloperBox.error_message_div = div();

    DeveloperBox.inner_div = div({ id: 'dev-box-inner' });
    DeveloperBox.outer_div = div({ id: 'dev-box' },
      ribbon_header("Developers"),
      br,
      DeveloperBox.error_message_div,
      DeveloperBox.inner_div
    );

    DeveloperBox.start_work_div = div({ id: 'start-work' },
      div("Want to earn the bounty on this issue? Submit a solution!"),
      br,
      a({ id: 'create-solution', 'class': 'button green', href: create_solution }, 'Start Work')
    );

    reload_content();

    return DeveloperBox.outer_div;
  });

  define('reload_content', function() {
    render({ target: this.inner_div }, 'Loading...');

    if (logged_in()) {
      BountySource.get_solutions(function(response) {
        if (response.meta.success) {
          var my_solution;
          for (var i=0; i<response.data.length; i++) {
            if (response.data[i].issue.id == DeveloperBox.issue.id) {
              my_solution = response.data[i];
              break;
            }
          }

          // cache the solution
          DeveloperBox.my_solution = my_solution;

          if (my_solution) {
            if (my_solution.accepted) {
              render({ into: DeveloperBox.inner_div }, success_message("Your solution has been accepted, congrats!"));
            } else if (my_solution.submitted) {
              render({ into: DeveloperBox.inner_div },
                success_message("Your submission has been submitted."),
                a({ 'class': 'button green', href: curry(set_route, my_solution.frontend_path) }, "My Submission")
              );
            } else {
              render({ into: DeveloperBox.inner_div },
                div("You are currently working on a solution to this issue."),
                br,
                a({ 'class': 'button green', href: my_solution.frontend_path }, "I'm Finished"),
                br,
                a({ 'class': 'button gray', href: destroy_solution }, "Cancel"),
                other_developers_message
              );
            }
          } else {
            render({ into: DeveloperBox.inner_div },
              DeveloperBox.start_work_div,
              other_developers_message
            );
          }
        } else {
          render({ target: this.inner_div }, error_message(response.data.error));
        }
      });
    } else {
      render({ into: DeveloperBox.inner_div },
        DeveloperBox.start_work_div,
        other_developers_message
      );
    }
  });

  define('other_developers_message', function() {
    var issue = DeveloperBox.issue;

    return div(
      issue.solutions && issue.solutions.length <= 0 && p({ style: 'font-size: 14px; font-style: italic; margin-bottom: 0;'},
        'Be the first developer to start working on a solution!'
      ),

      issue.solutions && issue.solutions.length > 0 && p({ style: 'font-size: 14px; font-style: italic; margin-bottom: 0;'},
        formatted_number(issue.solutions.length),
        (issue.solutions.length == 1 ? ' developer has' : ' developers have'),
        span(' started working on this.')
      )
    );
  });

  define('create_solution', function() {
    render({ target: DeveloperBox.error_message_div },'');

    BountySource.create_solution(DeveloperBox.issue.id, function(response) {
      if (response.meta.success) {
        // set cached solution
        DeveloperBox.solution = response.data;
        set_route(DeveloperBox.solution.frontend_path);
      } else {
        render({ target: DeveloperBox.error_message_div }, small_error_message(response.data.error));
      }
    })
  });

  define('destroy_solution', function() {
    render({ target: DeveloperBox.error_message_div },'');

    BountySource.destroy_solution(DeveloperBox.my_solution.id, function(response) {
      if (response.meta.success) {
        DeveloperBox.solution = undefined;
        reload_content();
      } else {
        render({ target: DeveloperBox.error_message_div }, small_error_message(response.data.error));
      }
    });
  });

}