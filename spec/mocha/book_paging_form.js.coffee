describe "BookPagingForm component", ->
  # FIXME page does not contain the first record on load
  xit "starts with Journey to Ixtlan", (done)->
    expectToSee textFieldWith "Journey to Ixtlan"
    done()

  it "then pages to Lolita", (done)->
    click button "Next Page"
    wait ->
      expectToSee textFieldWith "Lolita"
      done()

  it "and then pages to GTD", (done)->
    click button "Next Page"
    wait ->
      expectToSee textFieldWith "Getting Things Done"
      done()

