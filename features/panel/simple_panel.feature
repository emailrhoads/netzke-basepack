Feature: Panel
  In order to value
  As a role
  I want feature

  @selenium
  Scenario: The SimplePanel widget should be able to update its body's HTML from the server
    When I go to the SimplePanel test page
    When I should see "Original HTML"
    When I press "Update html"
    Then I should see "HTML received from server"
  
  
  
  
