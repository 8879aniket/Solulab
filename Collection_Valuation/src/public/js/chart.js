const currentYear = new Date().getFullYear()
var myChart;
$.ajax({
    type: 'GET',
    url: `${window.location.origin}/admin/dashboard-chartData`,
    contentType: 'application/json',
    success: function (data) {       
        let chartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        data.data.map(x => {
            if (x._id.year === currentYear) {
                chartData[x._id.month - 1] = (x.revenue)

            }
        })
        var lineData = {
            labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            datasets: [
                {
                    label: "Revenue",
                    fillColor: "rgba(26,179,148,0.5)",
                    strokeColor: "rgba(26,179,148,0.7)",
                    pointColor: "rgba(26,179,148,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(26,179,148,1)",
                    data: chartData,

                },
            ],

        };

        var lineOptions = {
            scaleShowGridLines: true,
            scaleGridLineColor: "rgba(0,0,0,.05)",
            scaleGridLineWidth: 1,
            bezierCurve: true,
            bezierCurveTension: 0.4,
            pointDot: true,
            pointDotRadius: 4,
            pointDotStrokeWidth: 1,
            pointHitDetectionRadius: 20,
            datasetStroke: true,
            datasetStrokeWidth: 2,
            datasetFill: true,
            responsive: true,
            events:[]

        }
        var barData = {
            labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            datasets: [
                {
                    label: "Revenue",
                    fillColor: "rgba(26,179,148,0.5)",
                    strokeColor: "rgba(26,179,148,0.8)",
                    highlightFill: "rgba(26,179,148,0.75)",
                    highlightStroke: "rgba(26,179,148,1)",
                    data: chartData
                }
            ]
        }
        var barOptions = {
            scaleBeginAtZero: true,
            scaleShowGridLines: true,
            scaleGridLineColor: "rgba(0,0,0,.05)",
            scaleGridLineWidth: 1,
            barShowStroke: true,
            barStrokeWidth: 2,
            barValueSpacing: 5,
            barDatasetSpacing: 1,
            responsive: true,
            events:[]
        }
        window.setTimeout(() => {
            var ctx = document.getElementById("lineChart").getContext("2d");
            myChart = new Chart(ctx).Line(lineData, lineOptions);

        }, 1000)
        window.setTimeout(() => {
            var ctx = document.getElementById("barChart").getContext("2d");
            window.chart = new Chart(ctx).Bar(barData, barOptions);

        }, 1000)
    },
    error: function (error) {
        alert(JSON.stringify(error))
    }

})


$('select').on('change', function (e) {
    var valueSelected = this.value;
    let chartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    $.ajax({
        type: 'GET',
        url: `${window.location.origin}/admin/dashboard-chartData`,
        contentType: 'application/json',
        success: function (data) {
            data.data.map(x => {

                if (x._id.year === +valueSelected) {
                    chartData[x._id.month - 1] = (x.revenue)
                }


            })
            var lineData = {
                labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                datasets: [
                    {
                        label: "Revenue",
                        fillColor: "rgba(26,179,148,0.5)",
                        strokeColor: "rgba(26,179,148,0.7)",
                        pointColor: "rgba(26,179,148,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(26,179,148,1)",
                        data: chartData,

                    },
                ],

            };

            var lineOptions = {
                scaleShowGridLines: true,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                bezierCurve: true,
                bezierCurveTension: 0.4,
                pointDot: true,
                pointDotRadius: 4,
                pointDotStrokeWidth: 1,
                pointHitDetectionRadius: 20,
                datasetStroke: true,
                datasetStrokeWidth: 2,
                datasetFill: true,
                responsive: true,
                events:[]

            }
            var barData = {
                labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                datasets: [
                    {
                        label: "Revenue",
                        fillColor: "rgba(26,179,148,0.5)",
                        strokeColor: "rgba(26,179,148,0.8)",
                        highlightFill: "rgba(26,179,148,0.75)",
                        highlightStroke: "rgba(26,179,148,1)",
                        data: chartData
                    }
                ]
            }
            var barOptions = {
                scaleBeginAtZero: true,
                scaleShowGridLines: true,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                scaleGridLineWidth: 1,
                barShowStroke: true,
                barStrokeWidth: 2,
                barValueSpacing: 5,
                barDatasetSpacing: 1,
                responsive: true,
                events:[]
            }
            window.setTimeout(() => {
                var ctx = document.getElementById("barChart").getContext("2d");
                if (window.chart && window.chart !== null) {
                    window.chart.destroy();
                    window.chart = new Chart(ctx).Bar(barData, barOptions);
                }
                
            }, 1000)
                window.setTimeout(() => {
                    var ctx = document.getElementById("lineChart").getContext("2d");
                    if(myChart){
                        myChart.destroy();
                        myChart = new Chart(ctx).Line(lineData, lineOptions);
                    }
                    
    
                }, 1000)
        },

        error: function (error) {
            alert(JSON.stringify(error))
        }

    })
});


