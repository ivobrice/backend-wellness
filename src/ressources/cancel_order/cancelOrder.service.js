const CancelOrder = require("./cancelOrder.model");
const Chat = require("../chat/chat.model")
const Order = require("../orders/order.model")
const HttpException = require("../../utils/exceptions/http.exception");
const { dbConnect } = require("../../config/dbConnect");

dbConnect();

const ERROR_MESSAGES = {
  CREATION_ERROR: 'Erreur de donnée',
};

class CancelOrderService {
  CancelOrder = CancelOrder;

  async updateById(req, res, next) {
    const session = "user"

    if (session) {
      try {
        const { value } = await req.json();
        const id = req.params.id;

        const canceledMessage = await CancelOrder.findOne({
          sellerId: session.user.id,
        });

        if (!canceledMessage) {
          throw new Error(`Vous n'etes pas autorisé à effectuer cette opération`);
        }

        const orderCancel = await CancelOrder.findByIdAndUpdate(
          id,
          {
            $set: {
              status: value,
            },
          },
          { new: true }
        );

        if (value === 'rejetée') {
          const order = await Order.findByIdAndUpdate(
            orderCancel.orderId,
            {
              $set: {
                status: 'Annulee',
              },
            },
            { new: true }
          );
        }

        if (value === 'approuvée') {
          const order = await Order.findByIdAndUpdate(
            orderCancel.orderId,
            {
              $set: {
                status: 'Annulée',
              },
            },
            { new: true }
          );
        }

        return new Response(JSON.stringify(orderCancel), {
          status: 201,
        });
      } catch (error) {
        console.log(error);
        return new Response(`Une erreur s'est produite`, { status: 500 });
      }
    } else {
      return new Response(
        'Vous devez vous connecter pour effectuer cette action',
        { status: 401 }
      );
    }
  }

  async getById(req, res, next) {
    const session = "user"

    const id = req.params.id;

    if (session) {
      try {
        const cancelOrder = await CancelOrder.findOne({ orderId: id });
        return new Response(JSON.stringify(cancelOrder), {
          status: 201,
        });
      } catch (error) {
        console.log(error);
        return new Response(`Erreur:Une erreur s'est produite`, { status: 500 });
      }
    } else {
      return new Response(
        'Vous devez vous connecter pour effectuer cette action',
        { status: 401 }
      );
    }
  }

  async create(req, res, next) {
    const session = "user"

    if (session) {
      const { orderId, url, reason } = await req.json();

      try {
        const oder = await Order.findById(orderId);
        const cancelOrder = await CancelOrder.findOne({ orderId: orderId });

        if (cancelOrder) {
          await CancelOrder.findOneAndUpdate(
            { orderId: orderId },
            {
              $set: { reason: reason },
            }
          );
        }

        if (oder.user.toString() !== session.user.id) {
          throw new Error(
            `Désolé vous n'etes pas autorisé a effectuer cette operation`
          );
        }
        const orderCancel = new CancelOrder({
          user: session.user.id,
          sellerId: oder.sellerId,
          orderId,
          reason,
        });

        await orderCancel.save();

        const chat = new Chat({
          sender: session.user.id,
          content: `Salut! Une demande d'annulation de la commande ${orderId} par ${session.user.username}. Voir <a href="${url}">ici</a>`,
          recipient: oder.sellerId,
        });

        const data = await chat.save();

        return new Response(JSON.stringify({ data, orderCancel }), {
          status: 201,
        });
      } catch (error) {
        console.log(error);
        return new Response(error, { status: 500 });
      }
    } else {
      return new Response(
        'Vous devez vous connecter pour effectuer cette action',
        { status: 401 }
      );
    }
  }

  async getAll(req, res, next) {
    const session = "user"

    if (session) {
      try {
        const { searchParams } = new URL(req.url);
        const limit = 3;
        const page = parseInt(searchParams.get('page')) || 1;
        const skip = (page - 1) * limit;

        let filter = searchParams.get('filter');
        let filterValue = {};

        switch (filter) {
          case 'en attente':
            filterValue = { status: 'en attente' };
            break;
          case 'approuvée':
            filterValue = { status: 'approuvée' };
            break;
          case 'rejetée':
            filterValue = { status: 'rejetée' };
            break;
          case 'Mes demandes':
            filterValue = { user: session.user.id };
            break;
          default:
            filterValue = {};
        }

        const total = await CancelOrder.countDocuments({
          sellerId: session.user.id,
          ...filterValue,
        });

        const pages = Math.floor(total / limit) + (total % limit > 0 ? 1 : 0);

        const cancelOrder = await CancelOrder.find({
          sellerId: session.user.id,
          ...filterValue,
        })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });

        return new Response(JSON.stringify({ cancelOrder, pages, total }), {
          status: 201,
        });
      } catch (error) {
        console.log(error);
        return new Response('Erreur de creation de service', { status: 500 });
      }
    } else {
      return new Response(
        'Vous devez vous connecter pour effectuer cette action',
        { status: 401 }
      );
    }
  }
}


module.exports = CancelOrderService;