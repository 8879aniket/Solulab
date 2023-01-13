const Agenda = require('agenda')
const config = require('../config/config')
const Logger = require('../common/middlewares/logger');
const _JobNotifyMessageReceivers  = require('../jobs/notify-message-receivers.job')
const _AuctionEndJob  = require('../jobs/auction-end.job')
let agenda = null

const AgendaHelper = {
  init() {
    agenda = new Agenda()
    delete config.db.options.useCreateIndex
    delete config.db.options.useFindAndModify
    agenda.database(
      config.db.str,
      'agendaJobs',
      config.db.options
    )

    agenda.define('NOTIFY_MESSAGE_RECEIVERS', async (job, done) => {
      const { data } = job.attrs
      try {
        const { _message } = data
        Logger.info(
          `SCHEDULER "NOTIFY_MESSAGE_RECEIVERS" IS RUNNING FOR MESSAGE ID: ${_message}`
        )
        await _JobNotifyMessageReceivers(data, job, done)
        return done()
      } catch (err) {
        Logger.info(err)
      }
    })

    agenda.define('AUCTION_END', async (job, done) => {
      const { data } = job.attrs
      try {
        await _AuctionEndJob(data, job, done)
        return done()
      } catch (err) {
        Logger.info(err)
      }
    })

    agenda.start()
  },

  Get() {
    return agenda
  }
}


AgendaHelper.init()
module.exports = AgendaHelper
