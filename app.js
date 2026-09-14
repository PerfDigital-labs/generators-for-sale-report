document.addEventListener("DOMContentLoaded", () => {

  const printButton =
    document.getElementById("print-report");


  if (printButton) {

    printButton.addEventListener(
      "click",
      () => {

        window.print();

      }
    );

  }

});
