'use strict';
// A standing household habit, NOT a fact learned from a reconstructed folio.
// The man has inhabited the tower for decades. This has no historical-memory grant.
const World=require('./world'),H=require('./household');
const DAY_TICKS=144,HUNGER_PER_TICK=.9,MEAL_RELIEF=75;
const DAILY_PORTIONS=DAY_TICKS*HUNGER_PER_TICK/MEAL_RELIEF;
const SHIPMENT_TICKS=World.CATALOG.groceries.delay,TRAVEL_HANDLING_TICKS=30,BUFFER_DAYS=2;
const MIN_PORTIONS=Math.ceil((BUFFER_DAYS+(SHIPMENT_TICKS+TRAVEL_HANDLING_TICKS)/DAY_TICKS)*DAILY_PORTIONS);
const WEEK_PORTIONS=Math.ceil(7*DAILY_PORTIONS);
function portions(stock){return stock.meals+stock.vegetables+Math.min(stock.milk,stock.grain)}
function plan(state){
 const onHand=portions(state.stock);
 const pending=state.orders.some(x=>['groceries','staples'].includes(x.type)&&!x.collected);
 const quote=H.price(World.CATALOG.staples.price,state.day,'staples');
 return {habit:'weekly_pantry_stocking',learnedFromFolio:false,periodDays:7,dailyMeals:DAILY_PORTIONS,
  reserveTriggerPortions:MIN_PORTIONS,weeklyPortions:WEEK_PORTIONS,onHand,remainingDays:onHand/DAILY_PORTIONS,
  transitTicks:SHIPMENT_TICKS,handlingReserveTicks:TRAVEL_HANDLING_TICKS,bufferDays:BUFFER_DAYS,
  sourceBundle:World.CATALOG.groceries.goods,quote,pending,
  eligible:onHand<=MIN_PORTIONS&&!pending&&!state.carried&&state.wallet>=quote};
}
module.exports={DAY_TICKS,DAILY_PORTIONS,MIN_PORTIONS,WEEK_PORTIONS,portions,plan};
