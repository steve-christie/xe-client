import {expect} from "chai";
import {isValidCCY} from "../src";

describe("Currency Code Tests", () => {

    it("When CCY is valid, return true", () => {
        expect(isValidCCY("GBP")).true
    })

    it("When CCY is not valid, return false", () => {
        expect(isValidCCY("invalid")).false
    })
})
