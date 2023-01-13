const express = require('express');
const router = express.Router();

const {
  createAuction,
  getMyAuction,
  updateAuction,
  deleteAuction,
  bidOnCoin,
  bidListing,
  participatedAuctionListing,
  awardBuyer,
} = require('../controller/auction');

// Auction
router.post('/create', createAuction);
router.get('/listing', getMyAuction);
router.put('/:auctionId', updateAuction);
router.delete('/:auctionId', deleteAuction);
router.post('/bid-on-coin', bidOnCoin);
router.get('/:auctionId/bid-listing', bidListing);
router.get('/participated', participatedAuctionListing);
router.post('/award-buyer', awardBuyer);

module.exports = router;
