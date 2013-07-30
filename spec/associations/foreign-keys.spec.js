/* jshint camelcase: false */
var buster    = require("buster")
  , Helpers   = require('../buster-helpers')
  , Sequelize = require('../../index')
  , DataTypes = require(__dirname + "/../../lib/data-types")
  , dialect   = Helpers.getTestDialect()

buster.spec.expose()
buster.testRunner.timeout = 1000

describe(Helpers.getTestDialectTeaser("ForeignKeys"), function() {
  var sequelize = Helpers.createSequelizeInstance({dialect: dialect})

  before(function(done) {
    var self = this
    self.sequelize = Object.create(sequelize)
    Helpers.clearDatabase(this.sequelize, done)
  })

  afterAll(function(done) {
    Helpers.clearDatabase(sequelize, done)
  })

  describe("Foreign key constraints", function() {
    it("are not enabled by default", function(done) {
      var self = Object.create(this.sequelize)
        , Task = self.define('Task1', { title: Sequelize.STRING })
        , User = self.define('User1', { username: Sequelize.STRING })

      User.hasMany(Task)

      User.sync({ force: true }).success(function() {
        Task.sync({ force: true }).success(function() {
          User.create({ username: 'foo' }).success(function(user) {
            Task.create({ title: 'task' }).success(function(task) {
              user.setTask1s([task]).success(function() {
                user.destroy().success(function() {
                  Task.findAll().success(function(tasks) {
                    expect(tasks.length).toEqual(1)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })

    it("can cascade deletes", function(done) {
      var self = Object.create(this.sequelize)
        , Task = self.define('Task2', { title: DataTypes.STRING })
        , User = self.define('User2', { username: DataTypes.STRING })

      User.hasMany(Task, {onDelete: 'cascade'})

      User.sync({ force: true }).success(function() {
        Task.sync({ force: true }).success(function() {
          User.create({ username: 'foo' }).success(function(user) {
            Task.create({ title: 'task' }).success(function(task) {
              user.setTask2s([task]).success(function() {
                user.destroy()
                .error(function(err) {
                  expect(false).toEqual('This shouldn\'t error.')
                  done()
                })
                .success(function() {
                  Task.all({where: {User2Id: user.id}}).success(function(tasks) {
                    expect(tasks.length).toEqual(0)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })

    it("can restrict deletes", function(done) {
      var self = Object.create(this.sequelize)
        , Task = self.define('Task3', { title: DataTypes.STRING })
        , User = self.define('User3', { username: DataTypes.STRING })

      User.hasMany(Task, {onDelete: 'restrict'})

      User.sync({ force: true }).success(function() {
        Task.sync({ force: true }).success(function() {
          User.create({ username: 'foo' }).success(function(user) {
            Task.create({ title: 'task' }).success(function(task) {
              user.setTask3s([task]).success(function() {
                user.destroy()
                .success(function(success) {
                  expect(false).toEqual('This shouldn\'t succeed.')
                  done()
                })
                .error(function(err) {
                  // Should fail due to FK restriction
                  Task.all().success(function(tasks) {
                    expect(tasks.length).toEqual(1)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })

    it("can cascade updates", function(done) {
      var self = Object.create(this.sequelize)
        , Task = self.define('Task4', { title: DataTypes.STRING })
        , User = self.define('User4', { username: DataTypes.STRING })

      User.hasMany(Task, {onUpdate: 'cascade'})

      User.sync({ force: true }).success(function() {
        Task.sync({ force: true }).success(function() {
          User.create({ username: 'foo' }).success(function(user) {
            Task.create({ title: 'task' }).success(function(task) {
              user.setTask4s([task]).success(function() {

                // Changing the id of a DAO requires a little dance since
                // the `UPDATE` query generated by `save()` uses `id` in the
                // `WHERE` clause

                var tableName = user.QueryInterface.QueryGenerator.addSchema(user.__factory)
                user.QueryInterface.update(user, tableName, {id: 999}, user.id)
                .error(function() {
                  expect(false).toEqual('This shouldn\'t error.')
                  done()
                })
                .success(function() {
                  Task.all().success(function(tasks) {
                    expect(tasks.length).toEqual(1)
                    expect(tasks[0].User4Id).toEqual(999)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })

    it("can restrict updates", function(done) {
      var self = Object.create(this.sequelize)
        , Task = self.define('Task5', { title: DataTypes.STRING })
        , User = self.define('User5', { username: DataTypes.STRING })

      User.hasMany(Task, {onUpdate: 'restrict'})

      User.sync({ force: true }).success(function() {
        Task.sync({ force: true }).success(function() {
          User.create({ username: 'foo' }).success(function(user) {
            Task.create({ title: 'task' }).success(function(task) {
              user.setTask5s([task]).success(function() {

                // Changing the id of a DAO requires a little dance since
                // the `UPDATE` query generated by `save()` uses `id` in the
                // `WHERE` clause

                var tableName = user.QueryInterface.QueryGenerator.addSchema(user.__factory)
                user.QueryInterface.update(user, tableName, {id: 999}, user.id)
                .success(function() {
                  expect(false).toEqual('You shouldn\'t reach this.')
                  done()
                })
                .error(function() {
                  // Should fail due to FK restriction
                  Task.all().success(function(tasks) {
                    expect(tasks.length).toEqual(1)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})