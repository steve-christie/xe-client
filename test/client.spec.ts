import {xeClient} from "../src/";
import * as sinon from "sinon";
import axios from "axios";
import {expect, use} from "chai";
import * as chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

describe("Client Tests", () => {

    let sandbox: sinon.SinonSandbox;


    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        sandbox.restore();
    });

    const client = xeClient("foo", "bar")

    it("When invalid from date is provided, then error is thrown", async() => {
        await expect(Promise.resolve( client.getRateForDate(
            "invalid_ccy", ["USD", "EUR"], new Date()
        ))).to.be.rejectedWith(
            "invalid_ccy is not a valid currency"
        );
    })

    it("When invalid to date is provided, then error is thrown", async() => {
        await expect(Promise.resolve( client.getRateForDate(
            "GBP", ["USD", "invalid_ccy"], new Date()
        ))).to.be.rejectedWith(
            "invalid_ccy is not a valid currency"
        );
    })

    it("When multiple invalid to date is provided, then error is thrown indicating multiple failed CCYs", async() => {
        await expect(Promise.resolve( client.getRateForDate(
            "GBP", ["invalid_ccy_1", "USD", "invalid_ccy_2"], new Date()
        ))).to.be.rejectedWith(
            "invalid_ccy_1,invalid_ccy_2 is not a valid currency"
        );
    })

    it("When successful response is returned, then rates are unpacked", async () => {
        const currencyDate = new Date("2022-05-12T23:00:00");

        sandbox.mock(axios).expects("get").withArgs("historic_rate", {
            params: {
                from: "GBP",
                to: "USD,EUR",
                amount: 1,
                date: "2022-05-12"
            },
            auth: {username: "foo", password: "bar"},
            baseURL: "https://xecdapi.xe.com/v1/"
        }).resolves({
            status: 200,
            statusText: "OK",
            headers: {"x-raterequest-remaining": 2048},
            data: {
                terms: "http://www.xe.com/legal/dfs.php",
                privacy: "http://www.xe.com/privacy.php",
                from: "GBP",
                amount: 1,
                timestamp: currencyDate,
                to: [{quotecurrency: "USD", mid: 1.210032}, {quotecurrency: "EUR", mid: 20002.098876}]
            }
        });

        const result = await client.getRateForDate("GBP", ["USD", "EUR"], currencyDate)

        expect(result.requestsRemaining).to.eq(2048)
        expect(result.rates).length(2)
        expect(result.rates[0].from).to.eq("GBP")
        expect(result.rates[0].from).to.eq("GBP")
        expect(result.rates[0].to).to.eq("USD")
        expect(result.rates[0].rate).to.eq(1.210032)
        expect(result.rates[0].timestamp).to.eq(currencyDate)
        expect(result.rates[1].from).to.eq("GBP")
        expect(result.rates[1].to).to.eq("EUR")
        expect(result.rates[1].rate).to.eq(20002.098876)
        expect(result.rates[1].timestamp).to.eq(currencyDate)
    })
})