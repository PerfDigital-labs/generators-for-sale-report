document.addEventListener("DOMContentLoaded", async () => {

  /* =======================================================
     ELEMENTS
  ======================================================= */

  const latestDateElement =
    document.getElementById("latest-date");

  const startDateInput =
    document.getElementById("start-date");

  const endDateInput =
    document.getElementById("end-date");

  const channelFilter =
    document.getElementById("channel-filter");

  const marketButtons =
    document.querySelectorAll("[data-market]");

  const viewLabel =
    document.getElementById("view-label");

  const printButton =
    document.getElementById("print-report");


  /* =======================================================
     STATE
  ======================================================= */

  let campaignRows = [];

  let selectedMarket = "all";

  let selectedChannel = "all";


  /* =======================================================
     FORMATTERS
  ======================================================= */

  const wholeNumberFormatter =
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
    });


  const currencyFormatter =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });


  const percentFormatter =
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });


  const dateFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      }
    );


  /* =======================================================
     HELPERS
  ======================================================= */

  function getChannel(row) {

    const campaign =
      REPORT_CONFIG.campaigns[
        String(row.campaign_id)
      ];

    return campaign
      ? campaign.channel
      : null;

  }


  function getMarketLabel(market) {

    if (market === "53305") {
      return "Omaha";
    }

    if (market === "53313") {
      return "Kansas City";
    }

    return "Both Markets";

  }


  function formatDisplayDate(dateString) {

    if (!dateString) {
      return "—";
    }

    const date =
      new Date(
        `${dateString}T00:00:00Z`
      );

    return dateFormatter.format(date);

  }


  function getRowsForDateAndChannel() {

    const startDate =
      startDateInput.value;

    const endDate =
      endDateInput.value;

    return campaignRows.filter(row => {

      const rowDate =
        row.date;

      if (
        startDate &&
        rowDate < startDate
      ) {
        return false;
      }

      if (
        endDate &&
        rowDate > endDate
      ) {
        return false;
      }

      if (
        selectedChannel !== "all" &&
        getChannel(row) !== selectedChannel
      ) {
        return false;
      }

      return true;

    });

  }


  function getFilteredRows() {

    return getRowsForDateAndChannel()
      .filter(row => {

        if (selectedMarket === "all") {
          return true;
        }

        return (
          String(row.journey_id) ===
          String(selectedMarket)
        );

      });

  }


  function aggregateRows(rows) {

    const totals = rows.reduce(
      (result, row) => {

        result.impressions +=
          Number(row.impressions || 0);

        result.clicks +=
          Number(row.clicks || 0);

        result.spend +=
          Number(row.spend || 0);

        result.conversions +=
          Number(row.conversions || 0);

        return result;

      },
      {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0
      }
    );


    totals.ctr =
      totals.impressions > 0
        ? (
            totals.clicks /
            totals.impressions
          ) * 100
        : 0;


    totals.cpm =
      totals.impressions > 0
        ? (
            totals.spend /
            totals.impressions
          ) * 1000
        : 0;


    return totals;

  }


  /* =======================================================
     UPDATE EXECUTIVE KPIS
  ======================================================= */

  function updateExecutiveOverview() {

    const filteredRows =
      getFilteredRows();

    const totals =
      aggregateRows(filteredRows);


    document.getElementById(
      "kpi-impressions"
    ).textContent =
      wholeNumberFormatter.format(
        totals.impressions
      );


    document.getElementById(
      "kpi-clicks"
    ).textContent =
      wholeNumberFormatter.format(
        totals.clicks
      );


    document.getElementById(
      "kpi-spend"
    ).textContent =
      currencyFormatter.format(
        totals.spend
      );


    document.getElementById(
      "kpi-conversions"
    ).textContent =
      wholeNumberFormatter.format(
        totals.conversions
      );


    document.getElementById(
      "kpi-ctr"
    ).textContent =
      `${percentFormatter.format(
        totals.ctr
      )}%`;


    document.getElementById(
      "kpi-cpm"
    ).textContent =
      currencyFormatter.format(
        totals.cpm
      );


    viewLabel.textContent =
      getMarketLabel(
        selectedMarket
      );

  }


  /* =======================================================
     UPDATE MARKET COMPARISON
  ======================================================= */

  function updateMarketComparison() {

    /*
      Market comparison respects:

      - selected date range
      - selected channel

      But intentionally compares BOTH markets
      even if the main executive view is set
      to Omaha or Kansas City.
    */

    const rows =
      getRowsForDateAndChannel();


    const omahaRows =
      rows.filter(
        row =>
          String(row.journey_id) ===
          "53305"
      );


    const kansasCityRows =
      rows.filter(
        row =>
          String(row.journey_id) ===
          "53313"
      );


    const omaha =
      aggregateRows(omahaRows);


    const kansasCity =
      aggregateRows(kansasCityRows);


    document.getElementById(
      "omaha-impressions"
    ).textContent =
      wholeNumberFormatter.format(
        omaha.impressions
      );


    document.getElementById(
      "kc-impressions"
    ).textContent =
      wholeNumberFormatter.format(
        kansasCity.impressions
      );

  }


  /* =======================================================
     UPDATE DASHBOARD
  ======================================================= */

  function updateDashboard() {

    updateExecutiveOverview();

    updateMarketComparison();

  }


  /* =======================================================
     MARKET BUTTONS
  ======================================================= */

  marketButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedMarket =
          button.dataset.market;


        marketButtons.forEach(
          otherButton => {

            otherButton.classList.remove(
              "active"
            );

          }
        );


        button.classList.add(
          "active"
        );


        updateDashboard();

      }
    );

  });


  /* =======================================================
     CHANNEL FILTER
  ======================================================= */

  channelFilter.addEventListener(
    "change",
    () => {

      selectedChannel =
        channelFilter.value;

      updateDashboard();

    }
  );


  /* =======================================================
     DATE FILTERS
  ======================================================= */

  startDateInput.addEventListener(
    "change",
    updateDashboard
  );


  endDateInput.addEventListener(
    "change",
    updateDashboard
  );


  /* =======================================================
     PRINT
  ======================================================= */

  if (printButton) {

    printButton.addEventListener(
      "click",
      () => {

        window.print();

      }
    );

  }


  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadReportData() {

    try {

      latestDateElement.textContent =
        "Loading...";


      const response =
        await fetch(
          REPORT_CONFIG.apiUrl,
          {
            method: "GET",
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `API returned ${response.status}`
        );

      }


      const data =
        await response.json();


      if (
        !data ||
        !Array.isArray(
          data.campaign_daily
        )
      ) {

        throw new Error(
          "campaign_daily was not returned by the API."
        );

      }


      campaignRows =
        data.campaign_daily;


      const latestDate =
        data.freshness?.latest_date ||
        campaignRows
          .map(row => row.date)
          .sort()
          .at(-1);


      /*
        Dashboard can be selected back to Jan 1,
        even though current campaign delivery
        begins later.
      */

      startDateInput.min =
        "2026-01-01";

      startDateInput.value =
        "2026-01-01";


      endDateInput.max =
        latestDate;

      endDateInput.value =
        latestDate;


      latestDateElement.textContent =
        formatDisplayDate(
          latestDate
        );


      updateDashboard();

    }

    catch (error) {

      console.error(
        "Unable to load report data:",
        error
      );


      latestDateElement.textContent =
        "Data unavailable";

    }

  }


  /* =======================================================
     START
  ======================================================= */

  await loadReportData();

});
