document.addEventListener(
  "DOMContentLoaded",
  async () => {


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const latestDateElement =
      document.getElementById(
        "latest-date"
      );


    const startDateInput =
      document.getElementById(
        "start-date"
      );


    const endDateInput =
      document.getElementById(
        "end-date"
      );


    const channelFilter =
      document.getElementById(
        "channel-filter"
      );


    const marketButtons =
      document.querySelectorAll(
        "[data-market]"
      );


    const viewLabel =
      document.getElementById(
        "view-label"
      );


    const printButton =
      document.getElementById(
        "print-report"
      );


    const trendMetric =
      document.getElementById(
        "trend-metric"
      );


    const performanceCanvas =
      document.getElementById(
        "performance-chart"
      );



    /* =====================================================
       STATE
    ===================================================== */

    let campaignRows = [];

    let selectedMarket =
      "all";

    let selectedChannel =
      "all";

    let performanceChart =
      null;



    /* =====================================================
       FORMATTERS
    ===================================================== */

    const wholeNumberFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0
        }
      );


    const currencyFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",

          currency: "USD",

          minimumFractionDigits: 2,

          maximumFractionDigits: 2
        }
      );


    const percentFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          minimumFractionDigits: 2,

          maximumFractionDigits: 2
        }
      );


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


    const shortDateFormatter =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",

          day: "numeric",

          timeZone: "UTC"
        }
      );



    /* =====================================================
       HELPERS
    ===================================================== */

    function getChannel(row) {

      const campaign =
        REPORT_CONFIG.campaigns[
          String(
            row.campaign_id
          )
        ];


      return campaign
        ? campaign.channel
        : null;

    }



    function getMarketLabel(
      market
    ) {

      if (
        market === "53305"
      ) {

        return "Omaha";

      }


      if (
        market === "53313"
      ) {

        return "Kansas City";

      }


      return "Both Markets";

    }



    function formatDisplayDate(
      dateString
    ) {

      if (
        !dateString
      ) {

        return "—";

      }


      const date =
        new Date(
          `${dateString}T00:00:00Z`
        );


      return dateFormatter.format(
        date
      );

    }



    function formatShortDate(
      dateString
    ) {

      const date =
        new Date(
          `${dateString}T00:00:00Z`
        );


      return shortDateFormatter.format(
        date
      );

    }



    /* =====================================================
       FILTERING
    ===================================================== */

    function getRowsForDateAndChannel() {

      const startDate =
        startDateInput.value;


      const endDate =
        endDateInput.value;


      return campaignRows.filter(
        row => {


          if (
            startDate &&
            row.date < startDate
          ) {

            return false;

          }


          if (
            endDate &&
            row.date > endDate
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

        }
      );

    }



    function getFilteredRows() {

      return getRowsForDateAndChannel()
        .filter(
          row => {


            if (
              selectedMarket === "all"
            ) {

              return true;

            }


            return (
              String(
                row.journey_id
              ) ===
              String(
                selectedMarket
              )
            );

          }
        );

    }



    /* =====================================================
       AGGREGATION
    ===================================================== */

    function aggregateRows(
      rows
    ) {

      const totals =
        rows.reduce(
          (
            result,
            row
          ) => {


            result.impressions +=
              Number(
                row.impressions || 0
              );


            result.clicks +=
              Number(
                row.clicks || 0
              );


            result.spend +=
              Number(
                row.spend || 0
              );


            result.conversions +=
              Number(
                row.conversions || 0
              );


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



    /* =====================================================
       EXECUTIVE OVERVIEW
    ===================================================== */

    function updateExecutiveOverview() {

      const filteredRows =
        getFilteredRows();


      const totals =
        aggregateRows(
          filteredRows
        );


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



    /* =====================================================
       MARKET COMPARISON
    ===================================================== */

    function updateMarketComparison() {

      /*
        This comparison respects:

        - Date
        - Channel

        It intentionally continues showing both
        Omaha and Kansas City side-by-side.
      */

      const rows =
        getRowsForDateAndChannel();


      const omahaRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53305"
        );


      const kansasCityRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53313"
        );


      const omaha =
        aggregateRows(
          omahaRows
        );


      const kansasCity =
        aggregateRows(
          kansasCityRows
        );


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



    /* =====================================================
       DAILY CHART DATA
    ===================================================== */

    function groupDaily(
      rows,
      metric
    ) {

      const daily = {};


      rows.forEach(
        row => {


          const date =
            row.date;


          if (
            !daily[date]
          ) {

            daily[date] =
              0;

          }


          daily[date] +=
            Number(
              row[metric] || 0
            );

        }
      );


      return daily;

    }



    /* =====================================================
       PERFORMANCE CHART
    ===================================================== */

    function updatePerformanceChart() {

      if (
        !performanceCanvas ||
        typeof Chart === "undefined"
      ) {

        return;

      }


      const metric =
        trendMetric.value;


      const rows =
        getRowsForDateAndChannel();


      const omahaRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53305"
        );


      const kansasCityRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53313"
        );


      const combinedDaily =
        groupDaily(
          rows,
          metric
        );


      const omahaDaily =
        groupDaily(
          omahaRows,
          metric
        );


      const kansasCityDaily =
        groupDaily(
          kansasCityRows,
          metric
        );


      const dates =
        [
          ...new Set(
            rows.map(
              row =>
                row.date
            )
          )
        ].sort();


      const labels =
        dates.map(
          date =>
            formatShortDate(
              date
            )
        );


      let datasets = [];


      /*
        BOTH MARKETS
      */

      if (
        selectedMarket === "all"
      ) {

        datasets = [

          {
            label:
              "Combined",

            data:
              dates.map(
                date =>
                  combinedDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#0066cc",

            backgroundColor:
              "#0066cc",

            borderWidth:
              3,

            tension:
              0.25,

            pointRadius:
              0,

            pointHoverRadius:
              4
          },


          {
            label:
              "Omaha",

            data:
              dates.map(
                date =>
                  omahaDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#00aeea",

            backgroundColor:
              "#00aeea",

            borderWidth:
              2,

            tension:
              0.25,

            pointRadius:
              0,

            pointHoverRadius:
              4
          },


          {
            label:
              "Kansas City",

            data:
              dates.map(
                date =>
                  kansasCityDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#667085",

            backgroundColor:
              "#667085",

            borderWidth:
              2,

            tension:
              0.25,

            pointRadius:
              0,

            pointHoverRadius:
              4
          }

        ];

      }



      /*
        OMAHA ONLY
      */

      if (
        selectedMarket === "53305"
      ) {

        datasets = [

          {
            label:
              "Omaha",

            data:
              dates.map(
                date =>
                  omahaDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#0066cc",

            backgroundColor:
              "#0066cc",

            borderWidth:
              3,

            tension:
              0.25,

            pointRadius:
              0,

            pointHoverRadius:
              4
          }

        ];

      }



      /*
        KANSAS CITY ONLY
      */

      if (
        selectedMarket === "53313"
      ) {

        datasets = [

          {
            label:
              "Kansas City",

            data:
              dates.map(
                date =>
                  kansasCityDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#0066cc",

            backgroundColor:
              "#0066cc",

            borderWidth:
              3,

            tension:
              0.25,

            pointRadius:
              0,

            pointHoverRadius:
              4
          }

        ];

      }



      if (
        performanceChart
      ) {

        performanceChart.destroy();

      }



      performanceChart =
        new Chart(
          performanceCanvas,
          {

            type:
              "line",


            data: {

              labels,

              datasets

            },


            options: {

              responsive:
                true,


              maintainAspectRatio:
                false,


              animation: {
                duration: 250
              },


              interaction: {

                mode:
                  "index",

                intersect:
                  false

              },


              plugins: {


                legend: {

                  position:
                    "top",

                  align:
                    "start",

                  labels: {

                    usePointStyle:
                      true,

                    boxWidth:
                      8,

                    padding:
                      18

                  }

                },


                tooltip: {

                  callbacks: {

                    label(
                      context
                    ) {


                      const value =
                        Number(
                          context.raw || 0
                        );


                      if (
                        metric === "spend"
                      ) {

                        return (
                          `${context.dataset.label}: ` +
                          currencyFormatter.format(
                            value
                          )
                        );

                      }


                      return (
                        `${context.dataset.label}: ` +
                        wholeNumberFormatter.format(
                          value
                        )
                      );

                    }

                  }

                }

              },


              scales: {


                y: {

                  beginAtZero:
                    true,


                  grid: {

                    color:
                      "#eef1f5"

                  },


                  ticks: {

                    callback(
                      value
                    ) {


                      if (
                        metric === "spend"
                      ) {

                        return (
                          "$" +
                          wholeNumberFormatter.format(
                            value
                          )
                        );

                      }


                      return wholeNumberFormatter.format(
                        value
                      );

                    }

                  }

                },


                x: {

                  grid: {

                    display:
                      false

                  },


                  ticks: {

                    maxTicksLimit:
                      12,

                    maxRotation:
                      0

                  }

                }

              }

            }

          }
        );

    }



    /* =====================================================
       UPDATE EVERYTHING
    ===================================================== */

    function updateDashboard() {

      updateExecutiveOverview();

      updateMarketComparison();

      updatePerformanceChart();

    }



    /* =====================================================
       MARKET BUTTONS
    ===================================================== */

    marketButtons.forEach(
      button => {


        button.addEventListener(
          "click",
          () => {


            selectedMarket =
              button.dataset.market;


            marketButtons.forEach(
              otherButton => {

                otherButton
                  .classList
                  .remove(
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

      }
    );



    /* =====================================================
       CHANNEL FILTER
    ===================================================== */

    channelFilter.addEventListener(
      "change",
      () => {


        selectedChannel =
          channelFilter.value;


        updateDashboard();

      }
    );



    /* =====================================================
       DATE FILTERS
    ===================================================== */

    startDateInput.addEventListener(
      "change",
      () => {


        if (
          endDateInput.value &&
          startDateInput.value >
          endDateInput.value
        ) {

          endDateInput.value =
            startDateInput.value;

        }


        updateDashboard();

      }
    );


    endDateInput.addEventListener(
      "change",
      () => {


        if (
          startDateInput.value &&
          endDateInput.value <
          startDateInput.value
        ) {

          startDateInput.value =
            endDateInput.value;

        }


        updateDashboard();

      }
    );



    /* =====================================================
       TREND METRIC
    ===================================================== */

    trendMetric.addEventListener(
      "change",
      () => {

        updatePerformanceChart();

      }
    );



    /* =====================================================
       PRINT
    ===================================================== */

    if (
      printButton
    ) {

      printButton.addEventListener(
        "click",
        () => {

          window.print();

        }
      );

    }



    /* =====================================================
       LOAD REPORT DATA
    ===================================================== */

    async function loadReportData() {

      try {


        latestDateElement.textContent =
          "Loading...";


        const response =
          await fetch(
            REPORT_CONFIG.apiUrl,
            {

              method:
                "GET",

              cache:
                "no-store"

            }
          );


        if (
          !response.ok
        ) {

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
            .map(
              row =>
                row.date
            )
            .sort()
            .at(-1);


        /*
          Keep Jan 1 available as the reporting
          start even though campaign delivery
          begins later.
        */

        startDateInput.min =
          "2026-01-01";


        startDateInput.max =
          latestDate;


        startDateInput.value =
          "2026-01-01";


        endDateInput.min =
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


      catch (
        error
      ) {


        console.error(
          "Unable to load report data:",
          error
        );


        latestDateElement.textContent =
          "Data unavailable";

      }

    }



    /* =====================================================
       START
    ===================================================== */

    await loadReportData();


  }
);
