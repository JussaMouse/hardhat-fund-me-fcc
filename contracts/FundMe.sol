// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

/** @title a contract for crowd funding
 *  @author JussaMouse
 *  @notice this contract was just written as a learning exercise. not fit for production!
 *  @dev this implements price feeds as our library
 */

contract FundMe {
    // type declarations
    using PriceConverter for uint256;

    // state variable
    uint256 public constant MINIMUM_USD = 50 * 10**18;
    address private immutable i_owner;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;

    // events (none)

    // modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // functions
    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner = msg.sender;
    }

    // receive/ feedback?
    receive() external payable {
        fund();
    }

    fallback() external payable {
        if (msg.value > 0) {
            fund();
        }
    }

    /** NatSpec example
     *  @notice bla
     *  @dev notes for devs
     *  @ param parameters taken by this function
     *  @ return the return value of the function
     */
    function fund() public payable {
        // goal: set a minimum amt of ETH
        // how do we send ETH to the contract?
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Not enough ETH"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    // function withdraw() public onlyOwner {
    //     // change all amounts funded to 0 in the mapping
    //     for (
    //         uint256 funderIndex = 0;
    //         funderIndex < s_funders.length;
    //         funderIndex++
    //     ) {
    //         address funder = s_funders[funderIndex];
    //         s_addressToAmountFunded[funder] = 0;
    //     }
    //     // reset the funders array
    //     s_funders = new address[](0);
    //     // transfer vs call vs send
    //     (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
    //     require(callSuccess, "Withdrawal failed");
    // }

    function withdraw() public payable onlyOwner {
        // in withdraw() we were reading from storage twice
        // in each iteration of the loop
        // instead, let's read once to copy to memory
        // and subsequently read from that (gas optimizing)
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    // getter functions for private variables:
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
